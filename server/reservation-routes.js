import mongoose from "mongoose";
import { aCentavos } from "../shared/cotizaciones.js";
import { Cliente } from "./models.js";
import { Oportunidad } from "./opportunity-model.js";
import { Cotizacion } from "./quote-models.js";
import { datosCliente, fechaCiudadMexico, versionActual } from "./quote-lifecycle.js";
import { clavePagoValida, referenciaPago, Reserva, transicionesReserva } from "./reservation-model.js";
import { isCalendarDate } from "./travel-models.js";

const conflict = "La reserva cambió. Recarga el detalle y vuelve a intentarlo.";
const terminal = (estado) => transicionesReserva[estado].length === 0;

function paymentSummary(reserva) {
  const { totalCentavos, pagadoCentavos, revision } = reserva;
  const pagos = [...reserva.pagos].sort((a, b) =>
    b.fecha.localeCompare(a.fecha) || new Date(b.registradoEn) - new Date(a.registradoEn));
  return { revision, totalCentavos, pagadoCentavos, saldoCentavos: totalCentavos - pagadoCentavos, pagos };
}

function reservaJson({ _id, pagos, clienteDocumento, ...reserva }) {
  return {
    id: String(_id), ...reserva, clienteDocumento,
    transiciones: transicionesReserva[reserva.estado],
    saldoCentavos: reserva.totalCentavos - reserva.pagadoCentavos,
    ...(pagos ? paymentSummary({ ...reserva, pagos }) : {}),
  };
}

export function registerReservationRoutes(app, { scope, fail, validId }) {
  const path = "/api/reservas";

  function text(value, field, max, required = false) {
    if (typeof value !== "string" || value.trim().length > max || (required && !value.trim()))
      throw fail(400, "Revisa el campo " + field + ".");
    return value.trim();
  }

  async function findReserva(req) {
    const reserva = await Reserva.findOne({ _id: req.params.id, ...scope(req) });
    if (!reserva) throw fail(404, "Reserva no encontrada.");
    return reserva;
  }

  async function saveReserva(reserva) {
    try {
      await reserva.save();
    } catch (error) {
      if (error.code === 10334 || error.code === 17419)
        throw fail(413, "La reserva alcanzó su límite de almacenamiento.");
      throw error;
    }
  }

  async function list(filter) {
    const rows = await Reserva.find(filter)
      .select("-conceptos -pagos -condiciones -observaciones -clienteDocumento.correo -clienteDocumento.telefono")
      .sort({ createdAt: -1, _id: -1 }).lean();
    return rows.map(reservaJson);
  }

  app.get(path, async (req, res) => {
    const filter = scope(req);
    if (req.query.estado !== undefined) {
      if (typeof req.query.estado !== "string" || !Object.hasOwn(transicionesReserva, req.query.estado))
        throw fail(400, "Estado de reserva inválido.");
      filter.estado = req.query.estado;
    }
    res.json(await list(filter));
  });

  app.get("/api/clientes/:id/reservas", validId, async (req, res) => {
    const filter = scope(req);
    if (!await Cliente.exists({ _id: req.params.id, ...filter }))
      throw fail(404, "Contacto no encontrado.");
    res.json(await list({ ...filter, cliente: req.params.id }));
  });

  app.get("/api/cotizaciones/:id/reserva", validId, async (req, res) => {
    const filter = scope(req);
    if (!await Cotizacion.exists({ _id: req.params.id, ...filter }))
      throw fail(404, "Cotización no encontrada.");
    const reserva = await Reserva.findOne({ cotizacion: req.params.id, ...filter })
      .select("folio estado").lean();
    res.json(reserva ? { id: String(reserva._id), folio: reserva.folio, estado: reserva.estado } : null);
  });

  app.get(path + "/:id", validId, async (req, res) => {
    res.json(reservaJson((await findReserva(req)).toObject()));
  });

  app.post(path, async (req, res) => {
    const { cotizacion, localizador = "", proveedorReferencia = "" } = req.body || {};
    if (typeof cotizacion !== "string" || !mongoose.isObjectIdOrHexString(cotizacion))
      throw fail(400, "Identificador de cotización inválido.");
    const locator = text(localizador, "localizador", 120);
    const provider = text(proveedorReferencia, "proveedor de referencia", 150);
    const filter = scope(req);
    const quote = await Cotizacion.findOne({ _id: cotizacion, ...filter }).select("-historial").lean();
    if (!quote) throw fail(404, "Cotización no encontrada.");
    const source = { ...filter, cotizacion: quote._id };
    const existing = await Reserva.findOne(source);
    if (existing) return res.json(reservaJson(existing.toObject()));

    const version = versionActual(quote);
    if (version.estado !== "Aceptada" || !Number.isSafeInteger(quote.versionAceptada) ||
        quote.versionAceptada < 1 || version.version !== quote.versionAceptada)
      throw fail(409, "La reserva requiere una versión aceptada de la cotización.");
    const ownership = { asesor: quote.asesor };
    const opportunity = await Oportunidad.findOne({ _id: quote.oportunidad, cliente: quote.cliente, ...ownership }).lean();
    if (!opportunity) throw fail(409, "La oportunidad no corresponde al cliente y asesor de la cotización.");
    if (opportunity.etapa !== "Ganada") throw fail(409, "La oportunidad debe estar en etapa Ganada.");
    const cliente = await Cliente.findOne({ _id: quote.cliente, ...ownership, "solicitudes._id": opportunity.solicitud })
      .select("nombre correo telefono solicitudes").lean();
    const solicitud = cliente?.solicitudes?.find(({ _id }) => _id.equals(opportunity.solicitud));
    if (!solicitud) throw fail(409, "La solicitud de viaje no corresponde al cliente de la cotización.");

    const _id = new mongoose.Types.ObjectId();
    const { conceptos, subtotalCentavos, impuestosCentavos, cargosCentavos, totalCentavos, condiciones, observaciones } = version;
    try {
      const saved = await Reserva.create({
        _id, folio: "RES-" + String(_id).toUpperCase(), folioCotizacion: quote.folio,
        ...source, cliente: quote.cliente, oportunidad: opportunity._id, solicitud: solicitud._id,
        versionAceptada: version.version, asesor: quote.asesor, registradaPor: req.usuario._id,
        estadoActualizadoPor: req.usuario._id, estadoActualizadoEn: new Date(),
        clienteDocumento: version.clienteDocumento ?? datosCliente(cliente),
        destino: solicitud.destino, salida: solicitud.salida, regreso: solicitud.regreso,
        vigenciaCotizacion: version.vigencia, conceptos, subtotalCentavos, impuestosCentavos,
        cargosCentavos, totalCentavos, condiciones, observaciones, localizador: locator, proveedorReferencia: provider,
      });
      return res.status(201).json(reservaJson(saved.toObject()));
    } catch (error) {
      if (error.code !== 11000) throw error;
      const saved = await Reserva.findOne(source);
      if (!saved) throw error;
      return res.json(reservaJson(saved.toObject()));
    }
  });

  app.patch(path + "/:id/estado", validId, async (req, res) => {
    const reserva = await findReserva(req);
    const { estado, revision, localizador, proveedorReferencia } = req.body || {};
    const hasMetadata = localizador !== undefined || proveedorReferencia !== undefined;
    if (!Number.isSafeInteger(revision) || revision < 0 ||
        (estado === undefined && !hasMetadata) ||
        (estado !== undefined && (typeof estado !== "string" || !Object.hasOwn(transicionesReserva, estado))))
      throw fail(400, "Revisa el estado, los datos de referencia o la revisión.");
    if (reserva.revision !== revision) throw fail(409, conflict);
    if (estado !== undefined && !transicionesReserva[reserva.estado].includes(estado))
      throw fail(409, "No se permite ese cambio desde el estado actual.");
    if (hasMetadata && terminal(reserva.estado))
      throw fail(409, "Una reserva cerrada conserva su localizador y proveedor.");
    if (localizador !== undefined) reserva.localizador = text(localizador, "localizador", 120);
    if (proveedorReferencia !== undefined)
      reserva.proveedorReferencia = text(proveedorReferencia, "proveedor de referencia", 150);
    if (estado !== undefined) {
      reserva.estado = estado;
      reserva.estadoActualizadoPor = req.usuario._id;
      reserva.estadoActualizadoEn = new Date();
    }
    try {
      await saveReserva(reserva);
    } catch (error) {
      if (error instanceof mongoose.Error.VersionError) throw fail(409, conflict);
      throw error;
    }
    res.json(reservaJson(reserva.toObject()));
  });

  app.get(path + "/:id/pagos", validId, async (req, res) => {
    res.json(paymentSummary((await findReserva(req)).toObject()));
  });

  app.post(path + "/:id/pagos", validId, async (req, res) => {
    let reserva = await findReserva(req);
    const { fecha, monto, clave, metodo, referencia, observaciones = "" } = req.body || {};
    const montoCentavos = aCentavos(monto);
    if (!isCalendarDate(fecha) || fecha > fechaCiudadMexico())
      throw fail(400, "Introduce una fecha de pago válida y no futura.");
    if (!(montoCentavos > 0) || !clavePagoValida(clave))
      throw fail(400, "Introduce un monto positivo con hasta dos decimales y una clave válida.");
    const payment = {
      fecha, montoCentavos, clave: clave.toLowerCase(),
      metodo: text(metodo, "método", 80, true),
      referencia: text(referencia, "referencia", 120, true),
      observaciones: text(observaciones, "observaciones", 500),
      registradoPor: req.usuario._id,
    };
    const reference = JSON.stringify(referenciaPago(payment));

    for (let attempt = 0; attempt < 4; attempt++) {
      const previous = reserva.pagos.find(({ clave }) => clave === payment.clave);
      if (previous) {
        const same = ["fecha", "montoCentavos", "metodo", "referencia", "observaciones"]
          .every((field) => previous[field] === payment[field]);
        if (!same) throw fail(409, "La clave ya se usó con datos de pago diferentes.");
        return res.json(paymentSummary(reserva.toObject()));
      }
      if (reserva.estado === "Cancelada") throw fail(409, "La reserva está cancelada.");
      if (reserva.pagos.some((item) => JSON.stringify(referenciaPago(item)) === reference))
        throw fail(409, "Ya se registró esa referencia para el mismo método.");
      if (montoCentavos > reserva.totalCentavos - reserva.pagadoCentavos)
        throw fail(409, "El monto supera el saldo pendiente.");
      reserva.pagos.push(payment);
      try {
        await saveReserva(reserva);
        return res.status(201).json(paymentSummary(reserva.toObject()));
      } catch (error) {
        if (!(error instanceof mongoose.Error.VersionError)) throw error;
        reserva = await findReserva(req);
      }
    }
    throw fail(409, conflict);
  });
}

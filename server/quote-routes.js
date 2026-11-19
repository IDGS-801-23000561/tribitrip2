import mongoose from "mongoose";
import { aCentavos, maxConceptos } from "../shared/cotizaciones.js";
import { Cliente } from "./models.js";
import { Oportunidad } from "./opportunity-model.js";
import { Cotizacion, ServicioTuristico } from "./quote-models.js";
import { isCalendarDate } from "./travel-models.js";

const asJson = ({ _id, ...data }) => ({ id: String(_id), ...data });
const quoteQuery = (query) => query.populate("cliente", "nombre").populate("oportunidad", "titulo").lean();

export function registerQuoteRoutes(app, { scope, fail, validId }) {
  const path = "/api/cotizaciones";

  function id(value, name) {
    if (typeof value !== "string" || !mongoose.isObjectIdOrHexString(value))
      throw fail(400, "Identificador inválido: " + name + ".");
    return new mongoose.Types.ObjectId(value);
  }

  function text(value, field, max, required = false) {
    if (typeof value !== "string" || value.trim().length > max || (required && !value.trim()))
      throw fail(400, "Revisa el campo " + field + ".");
    return value.trim();
  }

  function amount(value, field) {
    const cents = aCentavos(value);
    if (cents === null) throw fail(400, "Importe inválido: " + field + ". Usa hasta dos decimales.");
    return cents;
  }

  function searchTerm(value, field) {
    const term = text(value ?? "", field, 120);
    return new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  }

  async function quoteData(body, previous = []) {
    if (!isCalendarDate(body?.vigencia)) throw fail(400, "Introduce una fecha de vigencia válida.");
    if (!Array.isArray(body.conceptos) || !body.conceptos.length || body.conceptos.length > maxConceptos)
      throw fail(400, "Agrega entre 1 y " + maxConceptos + " conceptos.");
    const previousById = new Map(previous.map((item) => [String(item._id), item]));
    const seen = new Set();
    const lines = body.conceptos.map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item))
        throw fail(400, "Concepto inválido.");
      const saved = item.id === undefined ? null : previousById.get(String(id(item.id, "concepto")));
      if (item.id !== undefined && (!saved || seen.has(item.id.toLowerCase())))
        throw fail(400, "El concepto indicado no pertenece a esta cotización o está repetido.");
      if (saved) seen.add(String(saved._id));
      if (saved && item.servicio !== undefined)
        throw fail(400, "Para sustituir el servicio, elimina el concepto y agrega uno nuevo.");
      return {
        saved,
        servicio: saved?.servicio ?? (item.servicio === undefined ? null : id(item.servicio, "servicio")),
        descripcion: text(item.descripcion, "descripción del concepto " + (index + 1), 400, true),
        cantidad: typeof item.cantidad === "number" ? item.cantidad : NaN,
        precioUnitarioCentavos: amount(item.precioUnitario, "precio unitario del concepto " + (index + 1)),
      };
    });
    const serviceIds = lines.filter(({ saved, servicio }) => !saved && servicio).map(({ servicio }) => servicio);
    const services = serviceIds.length ? await ServicioTuristico.find({ _id: { $in: serviceIds } }).lean() : [];
    const byId = new Map(services.map((service) => [String(service._id), service]));
    const conceptos = lines.map(({ saved, servicio, ...data }) => {
      if (saved) return { ...data, _id: saved._id, servicio, referencia: saved.referencia };
      if (!servicio) return data;
      const service = byId.get(String(servicio));
      if (!service) throw fail(404, "Servicio turístico no encontrado.");
      const { nombre, descripcion, destino, proveedor, precioReferenciaCentavos } = service;
      return { ...data, servicio, referencia: { nombre, descripcion, destino, proveedor, precioReferenciaCentavos } };
    });
    return {
      vigencia: body.vigencia, conceptos,
      impuestosCentavos: amount(body.impuestos ?? "0", "impuestos"),
      cargosCentavos: amount(body.cargos ?? "0", "cargos"),
      condiciones: text(body.condiciones ?? "", "condiciones", 2000),
      observaciones: text(body.observaciones ?? "", "observaciones", 2000),
    };
  }

  async function listQuotes(filter) {
    const rows = await quoteQuery(Cotizacion.find(filter)
      .select("-conceptos -condiciones -observaciones")
      .sort({ createdAt: -1, _id: -1 }));
    return rows.map(asJson);
  }

  app.get("/api/servicios-turisticos", async (req, res) => {
    const { q, destino } = req.query;
    const filter = {};
    if (q) {
      const term = searchTerm(q, "búsqueda");
      filter.$or = [{ nombre: term }, { destino: term }];
    }
    if (destino) filter.destino = searchTerm(destino, "destino");
    res.json((await ServicioTuristico.find(filter).sort({ nombre: 1, _id: 1 }).lean()).map(asJson));
  });

  app.get("/api/servicios-turisticos/:id", validId, async (req, res) => {
    const servicio = await ServicioTuristico.findById(req.params.id).lean();
    if (!servicio) throw fail(404, "Servicio turístico no encontrado.");
    res.json(asJson(servicio));
  });

  app.get(path, async (req, res) => res.json(await listQuotes(scope(req))));
  app.get("/api/oportunidades/:id/cotizaciones", validId, async (req, res) => {
    const filter = scope(req);
    if (!await Oportunidad.exists({ _id: req.params.id, ...filter }))
      throw fail(404, "Oportunidad no encontrada.");
    res.json(await listQuotes({ ...filter, oportunidad: req.params.id }));
  });

  app.get(path + "/:id", validId, async (req, res) => {
    const quote = await quoteQuery(Cotizacion.findOne({ _id: req.params.id, ...scope(req) }));
    if (!quote) throw fail(404, "Cotización no encontrada.");
    res.json(asJson(quote));
  });

  app.post(path, async (req, res) => {
    const cliente = id(req.body?.cliente, "cliente");
    const oportunidad = id(req.body?.oportunidad, "oportunidad");
    const related = await Oportunidad.findOne({ _id: oportunidad, cliente, ...scope(req) }).select("asesor");
    if (!related || !await Cliente.exists({ _id: cliente, asesor: related.asesor }))
      throw fail(404, "Oportunidad no encontrada para ese cliente.");
    const _id = new mongoose.Types.ObjectId();
    const folio = "COT-" + String(_id).toUpperCase();
    const data = await quoteData(req.body);
    const quote = await Cotizacion.create({ ...data, _id, folio, cliente, oportunidad, asesor: related.asesor });
    res.status(201).json(asJson(quote.toObject()));
  });

  app.put(path + "/:id", validId, async (req, res) => {
    const quote = await Cotizacion.findOne({ _id: req.params.id, ...scope(req) });
    if (!quote) throw fail(404, "Cotización no encontrada.");
    const { revision } = req.body || {};
    if (!Number.isSafeInteger(revision) || revision < 0) throw fail(400, "Revisión inválida.");
    const conflict = "La cotización cambió. Recarga el detalle y vuelve a intentarlo.";
    if (quote.revision !== revision) throw fail(409, conflict);
    if (["cliente", "oportunidad", "asesor", "folio"].some((field) => Object.hasOwn(req.body, field)))
      throw fail(400, "El folio y las relaciones de la cotización se conservan.");
    quote.set(await quoteData(req.body, quote.conceptos));
    quote.markModified("conceptos");
    try {
      await quote.save();
    } catch (error) {
      if (error instanceof mongoose.Error.VersionError) throw fail(409, conflict);
      throw error;
    }
    res.json(asJson(quote.toObject()));
  });
}

import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { app } from "./app.js";
import { Cliente, Sesion } from "./models.js";
import { Oportunidad } from "./opportunity-model.js";
import { Cotizacion, ServicioTuristico } from "./quote-models.js";
import { tokenHash } from "./security.js";
import { aCentavos, calcularImportes, maxCentavos } from "../shared/cotizaciones.js";

const oid = () => new mongoose.Types.ObjectId();
const servicioValido = {
  nombre: "Paquete Playa (3 noches)", descripcion: "Hospedaje y traslado",
  tipo: "Paquete", destino: "Cancún", proveedor: "Proveedor de prueba", precioReferenciaCentavos: 12345,
};

test("catálogo valida descripción, tipo y precio de referencia en centavos", async () => {
  await new ServicioTuristico(servicioValido).validate();
  for (const invalid of [
    { nombre: " " }, { descripcion: "" }, { tipo: "Otro" },
    { precioReferenciaCentavos: -1 }, { precioReferenciaCentavos: 1.5 },
  ]) {
    await assert.rejects(new ServicioTuristico({ ...servicioValido, ...invalid }).validate(), { name: "ValidationError" });
  }
});

test("cálculo en centavos y validación del modelo de cotizaciones", async () => {
  assert.equal(aCentavos("0.1"), 10);
  assert.equal(aCentavos("0.01"), 1);
  for (const bad of ["1.005", "-1", "1e3", "10000000000.00", 12.5]) assert.equal(aCentavos(bad), null);
  assert.equal(calcularImportes([{ cantidad: 2, precioUnitarioCentavos: maxCentavos }], 0, 0), null);
  const input = {
    folio: "COT-" + String(oid()).toUpperCase(),
    cliente: oid(), oportunidad: oid(), asesor: oid(), vigencia: "2032-02-29",
    conceptos: [{ descripcion: "Traslado", cantidad: 3, precioUnitarioCentavos: 10 }],
    cargosCentavos: 20, totalCentavos: 7777,
  };
  const quote = new Cotizacion(input);
  await quote.validate();
  assert.equal(quote.conceptos[0].subtotalCentavos, 30);
  assert.equal(quote.subtotalCentavos, 30);
  assert.equal(quote.totalCentavos, 50);
  for (const invalid of [
    { folio: "otro" }, { cliente: null }, { oportunidad: null }, { asesor: null },
    { vigencia: "2031-02-29" }, { conceptos: [] }, { conceptos: null },
    { conceptos: [{ ...input.conceptos[0], cantidad: 1.5 }] },
    { conceptos: [{ ...input.conceptos[0], servicio: oid() }] },
  ]) {
    await assert.rejects(new Cotizacion({ ...input, ...invalid }).validate(), { name: "ValidationError" });
  }
});

test("API consulta el catálogo y protege la creación, consulta y edición de cotizaciones", async (t) => {
  const users = {
    asesor: { _id: oid(), rol: "Asesor", activo: true },
    ajeno: { _id: oid(), rol: "Asesor", activo: true },
    admin: { _id: oid(), rol: "Administrador", activo: true },
  };
  const clientes = [
    { _id: oid(), nombre: "Contacto uno", asesor: users.asesor._id },
    { _id: oid(), nombre: "Contacto dos", asesor: users.ajeno._id },
  ];
  const oportunidades = clientes.map(({ _id, asesor }) => ({
    _id: oid(), cliente: _id, asesor, titulo: "Viaje de prueba",
  }));
  const services = [
    { ...servicioValido, _id: oid() },
    { ...servicioValido, _id: oid(), nombre: "Museo", destino: "Mérida" },
  ];
  const quotes = [];
  const matches = (row, filter) => Object.entries(filter).every(([field, value]) => {
    if (field === "$or") return value.some((item) => matches(row, item));
    if (value instanceof RegExp) return value.test(row[field]);
    if (value?.$in) return value.$in.some((candidate) => row[field].equals(candidate));
    if (row[field] instanceof mongoose.Types.ObjectId) return row[field].equals(value);
    return row[field] === value;
  });
  const find = (rows, filter) => rows.find((row) => matches(row, filter));
  t.mock.method(Sesion, "findOne", ({ token }) => ({
    populate: async () => ({
      usuario: Object.entries(users).find(([key]) => tokenHash(key) === token)?.[1],
    }),
  }));
  t.mock.method(Cliente, "exists", async (filter) => find(clientes, filter));
  t.mock.method(Oportunidad, "exists", async (filter) => find(oportunidades, filter));
  t.mock.method(Oportunidad, "findOne", (filter) => ({ select: async () => find(oportunidades, filter) }));
  t.mock.method(ServicioTuristico, "find", (filter) => ({
    sort() { return this; },
    lean: async () => services.filter((row) => matches(row, filter)),
  }));
  t.mock.method(ServicioTuristico, "findById", (_id) => ({ lean: async () => find(services, { _id }) }));

  function quoteQuery(result) {
    let summary = false;
    function populate(row) {
      const copy = {
        ...row, cliente: find(clientes, { _id: row.cliente }),
        oportunidad: find(oportunidades, { _id: row.oportunidad }),
      };
      if (summary) delete copy.conceptos;
      return copy;
    }
    return {
      populate() { return this; },
      sort() { return this; },
      select() { summary = true; return this; },
      lean: async () => Array.isArray(result) ? result.map(populate) : result && populate(result),
      then(resolve) {
        return Promise.resolve(result ? Cotizacion.hydrate(result.toObject?.() ?? result) : null).then(resolve);
      },
    };
  }
  t.mock.method(Cotizacion, "findOne", (filter) => quoteQuery(find(quotes, filter)));
  t.mock.method(Cotizacion, "find", (filter) => quoteQuery(quotes.filter((row) => matches(row, filter))));
  t.mock.method(Cotizacion.collection, "insertOne", async (row) => {
    assert.equal(quotes.some(({ folio }) => folio === row.folio), false);
    quotes.push(row);
    return { acknowledged: true, insertedId: row._id };
  });
  t.mock.method(Cotizacion.collection, "updateOne", async (filter, update) => {
    assert.ok(Number.isInteger(filter.revision));
    const row = find(quotes, filter);
    if (!row) return { matchedCount: 0 };
    Object.assign(row, update.$set);
    row.revision += update.$inc.revision;
    return { matchedCount: 1 };
  });

  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  async function call(path, session, method = "GET", data) {
    const headers = { Origin: process.env.APP_ORIGIN || "http://localhost:5173" };
    if (session) headers.Cookie = "session=" + session;
    if (data) headers["Content-Type"] = "application/json";
    const res = await fetch("http://127.0.0.1:" + server.address().port + "/api" + path, {
      method, headers, body: data ? JSON.stringify(data) : undefined,
    });
    return { status: res.status, body: await res.json() };
  }

  const catalog = "/servicios-turisticos";
  const path = "/cotizaciones";
  const servicioId = String(services[0]._id);
  assert.equal((await call(catalog)).status, 401);
  assert.equal((await call(catalog + "?q=playa%20%28", "asesor")).body[0].id, servicioId);
  assert.equal((await call(catalog + "?q=Canc%C3%BAn&destino=canc", "asesor")).body.length, 1);
  assert.equal((await call(catalog + "?q=.*", "asesor")).body.length, 0);
  assert.equal((await call(catalog + "?q=a&q=b", "asesor")).status, 400);
  assert.equal((await call(catalog + "/" + servicioId, "asesor")).body.tipo, "Paquete");
  assert.equal((await call(catalog + "/" + oid(), "asesor")).status, 404);
  assert.equal((await call(catalog + "/mal", "asesor")).status, 400);
  assert.equal((await call(catalog, "admin", "POST", servicioValido)).status, 404);

  const fields = {
    vigencia: "2032-02-29", condiciones: "Sujeto a disponibilidad", observaciones: "Servicio en español",
    impuestos: "0.20", cargos: "0.15",
    conceptos: [
      { servicio: servicioId, descripcion: "Paquete personalizado", cantidad: 2, precioUnitario: "124.10", subtotalCentavos: 1 },
      { descripcion: "Cargo separado", cantidad: 3, precioUnitario: "0.10" },
    ],
  };
  const input = {
    ...fields, cliente: String(clientes[0]._id), oportunidad: String(oportunidades[0]._id),
    asesor: String(users.ajeno._id), folio: "inyectado", totalCentavos: 1,
  };
  assert.equal((await call(path)).status, 401);
  assert.equal((await call(path, null, "POST", input)).status, 401);
  assert.equal((await call(path, "ajeno", "POST", input)).status, 404);
  assert.equal((await call(path, "admin", "POST", { ...input, oportunidad: String(oportunidades[1]._id) })).status, 404);
  assert.equal((await call(path, "asesor", "POST", { ...input, cliente: {} })).status, 400);
  assert.equal((await call(path, "asesor", "POST", { ...input, impuestos: "0.005" })).status, 400);
  assert.equal((await call(path, "asesor", "POST", { ...input, conceptos: [{ ...fields.conceptos[0], cantidad: "2" }] })).status, 400);
  assert.equal((await call(path, "asesor", "POST", { ...input, conceptos: [{ ...fields.conceptos[0], servicio: String(oid()) }] })).status, 404);

  const created = await Promise.all([
    call(path, "asesor", "POST", input),
    call(path, "admin", "POST", input),
  ]);
  assert.deepEqual(created.map(({ status }) => status), [201, 201]);
  const [first, second] = created.map(({ body }) => body);
  assert.notEqual(first.folio, second.folio);
  assert.equal(first.folio, "COT-" + first.id.toUpperCase());
  assert.equal(first.asesor, String(users.asesor._id));
  assert.equal(first.subtotalCentavos, 24850);
  assert.equal(first.totalCentavos, 24885);
  assert.equal(first.conceptos[0].subtotalCentavos, 24820);
  assert.equal(first.conceptos[0].referencia.precioReferenciaCentavos, 12345);
  const detail = path + "/" + first.id;
  const related = "/oportunidades/" + input.oportunidad + path;
  assert.equal((await call(path, "asesor")).body.length, 2);
  assert.equal((await call(path, "asesor")).body[0].conceptos, undefined);
  assert.equal((await call(path, "ajeno")).body.length, 0);
  assert.equal((await call(related, "admin")).body.length, 2);
  assert.equal((await call(related, "ajeno")).status, 404);
  assert.equal((await call(detail, "ajeno")).status, 404);
  assert.equal((await call(detail, "ajeno", "PUT", { ...fields, revision: 0 })).status, 404);

  services[0].nombre = "Catálogo cambiado";
  services[0].precioReferenciaCentavos = 99999;
  assert.equal((await call(detail, "admin")).body.conceptos[0].referencia.nombre, servicioValido.nombre);
  const edit = {
    ...fields, revision: 0,
    conceptos: [{ id: first.conceptos[0]._id, descripcion: "Concepto revisado", cantidad: 1, precioUnitario: "124.10" }],
  };
  assert.equal((await call(detail, "asesor", "PUT", { ...edit, cliente: input.cliente })).status, 400);
  assert.equal((await call(detail, "asesor", "PUT", { ...edit, conceptos: [{ ...edit.conceptos[0], id: second.conceptos[0]._id }] })).status, 400);
  const edits = await Promise.all([
    call(detail, "asesor", "PUT", edit),
    call(detail, "admin", "PUT", edit),
  ]);
  assert.deepEqual(edits.map(({ status }) => status).sort(), [200, 409]);
  const updated = (await call(detail, "asesor")).body;
  assert.equal(updated.folio, first.folio);
  assert.equal(updated.revision, 1);
  assert.equal(updated.totalCentavos, 12445);
  assert.equal(updated.conceptos.length, 1);
  assert.equal(updated.conceptos[0].referencia.precioReferenciaCentavos, 12345);
  assert.equal(updated.conceptos[0].descripcion, "Concepto revisado");
});

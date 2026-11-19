import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { Usuario, Sesion, Cliente } from "./models.js";
import { registerTravelRoutes } from "./travel-routes.js";
import { registerOpportunityRoutes } from "./opportunity-routes.js";
import { registerQuoteRoutes } from "./quote-routes.js";
import { registerReservationRoutes } from "./reservation-routes.js";
import {
  hashPassword,
  verifyPassword,
  tokenHash,
  publicUser,
} from "./security.js";
export const app = express();
app.disable("x-powered-by");
app.use(helmet(), express.json({ limit: "32kb" }), cookieParser());
const cookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
  path: "/api",
};
const fail = (status, message) => Object.assign(new Error(message), { status });
app.use("/api", (req, res, next) => {
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    req.get("origin") !== (process.env.APP_ORIGIN || "http://localhost:5173")
  )
    return next(fail(403, "Origen de solicitud no permitido."));
  next();
});
app.get("/api/health", (req, res) =>
  res
    .status(mongoose.connection.readyState === 1 ? 200 : 503)
    .json({ conectado: mongoose.connection.readyState === 1 }),
);
app.post(
  "/api/auth/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 15,
    message: { mensaje: "Demasiados intentos. Intenta más tarde." },
  }),
  async (req, res) => {
    const { correo, password } = req.body || {};
    if (typeof correo !== "string" || typeof password !== "string")
      throw fail(400, "Introduce correo y contraseña.");
    const usuario = await Usuario.findOne({
      correo: correo.trim().toLowerCase(),
    }).select("+passwordHash");
    if (
      !usuario ||
      !usuario.activo ||
      !(await verifyPassword(password, usuario.passwordHash))
    )
      throw fail(401, "Credenciales incorrectas.");
    if (req.cookies.session)
      await Sesion.deleteOne({ token: tokenHash(req.cookies.session) });
    const token = randomBytes(32).toString("hex");
    await Sesion.create({
      token: tokenHash(token),
      usuario: usuario._id,
      expiresAt: new Date(Date.now() + 8 * 3600000),
    });
    res
      .cookie("session", token, { ...cookieOptions, maxAge: 8 * 3600000 })
      .json(publicUser(usuario));
  },
);
app.use("/api", async (req, res, next) => {
  const token = req.cookies.session;
  const session =
    token &&
    (await Sesion.findOne({
      token: tokenHash(token),
      expiresAt: { $gt: new Date() },
    }).populate("usuario"));
  if (!session || !session.usuario?.activo)
    throw fail(401, "Inicia sesión para continuar.");
  req.usuario = session.usuario;
  next();
});
app.get("/api/auth/me", (req, res) => res.json(publicUser(req.usuario)));
app.post("/api/auth/logout", async (req, res) => {
  await Sesion.deleteOne({ token: tokenHash(req.cookies.session) });
  res.clearCookie("session", cookieOptions).sendStatus(204);
});
const admin = (req, res, next) =>
  req.usuario.rol === "Administrador"
    ? next()
    : next(fail(403, "Acceso exclusivo para administradores."));
const validId = (req, res, next) =>
  mongoose.isObjectIdOrHexString(req.params.id)
    ? next()
    : next(fail(400, "Identificador inválido."));
app.get("/api/usuarios", admin, async (req, res) =>
  res.json((await Usuario.find().sort({ nombre: 1 })).map(publicUser)),
);
function userData(body) {
  const { nombre, correo, rol, activo } = body || {};
  if (
    typeof nombre !== "string" ||
    !nombre.trim() ||
    typeof correo !== "string" ||
    !["Administrador", "Asesor"].includes(rol) ||
    typeof activo !== "boolean"
  )
    throw fail(400, "Revisa nombre, correo, rol y estado.");
  return { nombre, correo, rol, activo };
}
app.post("/api/usuarios", admin, async (req, res) => {
  const datos = userData(req.body);
  const usuario = await Usuario.create({
    ...datos,
    passwordHash: await hashPassword(req.body.password),
  });
  res.status(201).json(publicUser(usuario));
});
app.put("/api/usuarios/:id", admin, validId, async (req, res) => {
  const datos = userData(req.body);
  if (
    req.params.id === String(req.usuario._id) &&
    (!datos.activo || datos.rol !== "Administrador")
  )
    throw fail(
      400,
      "No puedes desactivar tu cuenta ni quitarte el rol de administrador.",
    );
  const usuario = await Usuario.findById(req.params.id);
  if (!usuario) throw fail(404, "Usuario no encontrado.");
  Object.assign(usuario, datos);
  if (req.body.password)
    usuario.passwordHash = await hashPassword(req.body.password);
  await usuario.save();
  await Sesion.deleteMany({ usuario: usuario._id });
  res.json(publicUser(usuario));
});
const scope = (req) =>
  req.usuario.rol === "Administrador" ? {} : { asesor: req.usuario._id };
const clientJson = (c) => {
  const data = c.toObject();
  delete data.solicitudes;
  return { ...data, id: String(c._id), fechaRegistro: c.createdAt };
};
function clientData(body) {
  const fields = [
    "nombre",
    "correo",
    "telefono",
    "ubicacion",
    "estado",
    "origen",
    "contactoPreferido",
    "destinoInteres",
  ];
  const data = {};
  for (const key of fields) {
    if (body[key] !== undefined && typeof body[key] !== "string")
      throw fail(400, "Campo inválido: " + key);
    if (body[key] !== undefined) data[key] = body[key].trim();
  }
  if (data.telefono) data.telefono = data.telefono.replace(/\D/g, "");
  if (
    body.presupuesto === "" ||
    body.presupuesto === null ||
    body.presupuesto === undefined
  )
    data.presupuesto = null;
  else {
    if (
      typeof body.presupuesto !== "number" ||
      !Number.isFinite(body.presupuesto) ||
      body.presupuesto < 0
    )
      throw fail(400, "Presupuesto inválido.");
    data.presupuesto = body.presupuesto;
  }
  return data;
}
app.get("/api/clientes", async (req, res) =>
  res.json(
    (await Cliente.find(scope(req)).sort({ createdAt: -1 })).map(clientJson),
  ),
);
app.get("/api/clientes/:id", validId, async (req, res) => {
  const cliente = await Cliente.findOne({ _id: req.params.id, ...scope(req) });
  if (!cliente) throw fail(404, "Contacto no encontrado.");
  res.json(clientJson(cliente));
});
app.post("/api/clientes", async (req, res) => {
  const cliente = await Cliente.create({
    ...clientData(req.body || {}),
    asesor: req.usuario._id,
  });
  res.status(201).json(clientJson(cliente));
});
app.put("/api/clientes/:id", validId, async (req, res) => {
  const cliente = await Cliente.findOne({ _id: req.params.id, ...scope(req) });
  if (!cliente) throw fail(404, "Contacto no encontrado.");
  Object.assign(cliente, clientData(req.body || {}));
  await cliente.save();
  res.json(clientJson(cliente));
});
app.delete("/api/clientes/:id", validId, async (req, res) => {
  const filter = { _id: req.params.id, ...scope(req) };
  const cliente = await Cliente.findOneAndDelete({
    ...filter, "solicitudes.0": { $exists: false },
  });
  if (!cliente) {
    if (await Cliente.exists(filter))
      throw fail(409, "No se puede eliminar un contacto con solicitudes de viaje.");
    throw fail(404, "Contacto no encontrado.");
  }
  res.sendStatus(204);
});
registerTravelRoutes(app, { scope, fail, validId });
registerOpportunityRoutes(app, { scope, fail, validId, admin });
registerQuoteRoutes(app, { scope, fail, validId });
registerReservationRoutes(app, { scope, fail, validId });
app.use("/api", (req, res) =>
  res.status(404).json({ mensaje: "Ruta no encontrada." }),
);
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.code === 11000)
    return res
      .status(409)
      .json({ mensaje: "Ya existe un registro con ese correo o teléfono." });
  if (error.name === "ValidationError" || error.name === "CastError")
    return res
      .status(400)
      .json({
        mensaje: "Revisa los campos obligatorios, formatos e importes.",
      });
  const status = error.status || 500;
  if (status >= 500) console.error("Error API:", error.name);
  res
    .status(status)
    .json({
      mensaje:
        status >= 500
          ? "No fue posible completar la operación."
          : error.message,
    });
});

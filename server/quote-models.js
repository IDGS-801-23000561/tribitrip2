import mongoose from "mongoose";
import { calcularImportes, maxCantidad, maxCentavos } from "../shared/cotizaciones.js";
import { isCalendarDate } from "./travel-models.js";

const { Schema } = mongoose;
const money = { type: Number, required: true, min: 0, max: maxCentavos, validate: Number.isSafeInteger };
const text = (maxlength) => ({ type: String, trim: true, maxlength, default: "" });
const requiredText = (maxlength) => ({ type: String, trim: true, maxlength, required: true });
const relation = (ref) => ({ type: Schema.Types.ObjectId, ref, required: true, immutable: true });

const serviceSchema = new Schema({
  nombre: requiredText(150),
  descripcion: requiredText(400),
  tipo: { type: String, enum: ["Servicio", "Paquete"], required: true, default: "Servicio" },
  categoria: text(100),
  destino: text(120),
  proveedor: text(150),
  precioReferenciaCentavos: money,
}, { timestamps: true });

const snapshotSchema = new Schema({
  nombre: requiredText(150),
  descripcion: requiredText(400),
  destino: text(120),
  proveedor: text(150),
  precioReferenciaCentavos: money,
}, { _id: false });

const conceptSchema = new Schema({
  servicio: { type: Schema.Types.ObjectId, ref: "ServicioTuristico", default: null },
  referencia: { type: snapshotSchema, default: null },
  descripcion: requiredText(400),
  cantidad: { type: Number, required: true, min: 1, max: maxCantidad, validate: Number.isInteger },
  precioUnitarioCentavos: money,
  subtotalCentavos: money,
});

const quoteSchema = new Schema({
  folio: { type: String, required: true, immutable: true, unique: true, match: /^COT-[0-9A-F]{24}$/ },
  cliente: relation("Cliente"),
  oportunidad: relation("Oportunidad"),
  asesor: relation("Usuario"),
  vigencia: { type: String, required: true, validate: isCalendarDate },
  conceptos: { type: [conceptSchema], required: true },
  impuestosCentavos: { ...money, default: 0 },
  cargosCentavos: { ...money, default: 0 },
  subtotalCentavos: money,
  totalCentavos: money,
  condiciones: text(2000),
  observaciones: text(2000),
}, { timestamps: true, versionKey: "revision", optimisticConcurrency: true });

quoteSchema.pre("validate", function () {
  const amounts = calcularImportes(this.conceptos, this.impuestosCentavos, this.cargosCentavos);
  if (!amounts) {
    this.invalidate("conceptos", "Revisa cantidades, importes y número de conceptos.");
    return;
  }
  this.conceptos.forEach((concepto, index) => {
    if (Boolean(concepto.servicio) !== Boolean(concepto.referencia))
      this.invalidate("conceptos." + index, "El servicio debe conservar su referencia.");
    concepto.subtotalCentavos = amounts.importes[index];
  });
  this.subtotalCentavos = amounts.subtotalCentavos;
  this.totalCentavos = amounts.totalCentavos;
});

quoteSchema.index({ asesor: 1, createdAt: -1 });
quoteSchema.index({ oportunidad: 1, createdAt: -1 });
export const ServicioTuristico = mongoose.model("ServicioTuristico", serviceSchema);
export const Cotizacion = mongoose.model("Cotizacion", quoteSchema);

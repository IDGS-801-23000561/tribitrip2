import { useRef, useState } from "react";
import { api } from "../../services/api";
import { mostrarImporte } from "../cotizaciones/importes";

const hoy = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());

export default function PagosInformativos({ reserva, onSaved, disabled, onBusyChange }) {
  const intento = useRef(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const serialized = JSON.stringify(data);
    if (intento.current?.serialized !== serialized)
      intento.current = { serialized, clave: crypto.randomUUID() };
    setBusy(true);
    onBusyChange(true);
    setError("");
    try {
      onSaved(await api("/reservas/" + reserva.id + "/pagos", {
        method: "POST", body: { ...data, clave: intento.current.clave },
      }));
      intento.current = null;
      setAdding(false);
      setNotice("Pago informativo registrado.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      onBusyChange(false);
    }
  }

  return (
    <section className="panel">
      <h2>Pagos informativos</h2>
      <p>TribiTrip registra los pagos reportados por el cliente. El registro no realiza ningún cobro.</p>
      <dl>
        <dt>Importe acordado</dt><dd>{mostrarImporte(reserva.totalCentavos)}</dd>
        <dt>Total registrado</dt><dd>{mostrarImporte(reserva.pagadoCentavos)}</dd>
        <dt>Saldo pendiente</dt><dd>{mostrarImporte(reserva.saldoCentavos)}</dd>
      </dl>
      {reserva.estado === "Cancelada" && <p>La reserva está cancelada. Los pagos anteriores se conservan en el historial.</p>}
      {notice && <p role="status">{notice}</p>}
      {!adding && reserva.estado !== "Cancelada" && reserva.saldoCentavos > 0 && (
        <button type="button" className="btn-primary" disabled={disabled} onClick={() => {
          setNotice("");
          setAdding(true);
        }}>Registrar pago informativo</button>
      )}
      {adding && reserva.estado !== "Cancelada" && (
        <form className="account-form" onSubmit={submit}>
          <label>Fecha del pago<input name="fecha" type="date" required max={hoy()} defaultValue={hoy()} /></label>
          <label>Monto (MXN)<input name="monto" type="number" required min="0.01" step="0.01" max={(reserva.saldoCentavos / 100).toFixed(2)} /></label>
          <label>Método informado<input name="metodo" required maxLength={80} /></label>
          <label>Referencia del pago<input name="referencia" required maxLength={120} /></label>
          <label>Observaciones<textarea name="observaciones" maxLength={500} rows={3} /></label>
          {error && <p role="alert">{error}</p>}
          <div className="formulario-acciones">
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => {
              setError("");
              setAdding(false);
            }}>Cancelar</button>
            <button className="btn-primary" disabled={busy || disabled}>{busy ? "Guardando…" : "Guardar registro"}</button>
          </div>
        </form>
      )}
      {reserva.pagos.length === 0 ? <p>No hay pagos registrados.</p> : (
        <div className="tabla-contenedor">
          <table className="tabla-clientes">
            <thead><tr><th>Fecha del pago</th><th>Monto</th><th>Método informado</th><th>Referencia</th><th>Observaciones</th></tr></thead>
            <tbody>
              {reserva.pagos.map((pago) => (
                <tr key={pago._id}>
                  <td>{pago.fecha}</td><td>{mostrarImporte(pago.montoCentavos)}</td>
                  <td>{pago.metodo}</td><td>{pago.referencia}</td><td>{pago.observaciones || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

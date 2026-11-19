import { useState } from "react";
import { api } from "../../services/api";

const tipos = ["Adulto", "Menor", "Infante"];

export default function Viajeros({ solicitud, onSaved }) {
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { viajeros, cantidadViajeros } = solicitud;

  function openForm(viajero) {
    setError("");
    setForm(viajero);
  }

  async function submit(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const path = "/solicitudes/" + solicitud.id + "/viajeros";
    setBusy(true);
    setError("");
    try {
      const saved = await api(form.id ? path + "/" + form.id : path, {
        method: form.id ? "PUT" : "POST",
        body,
      });
      onSaved(saved);
      setForm(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h2>Viajeros y acompañantes</h2>
      <p>{viajeros.length} de {cantidadViajeros} registrados</p>
      <ul>
        {tipos.map((tipo) => (
          <li key={tipo}>{tipo}: {viajeros.filter((viajero) => viajero.tipo === tipo).length}</li>
        ))}
      </ul>
      {!form && viajeros.length < cantidadViajeros && (
        <button className="btn-primary" onClick={() => openForm({})}>Registrar viajero</button>
      )}
      {!form && viajeros.length === cantidadViajeros && (
        <p>Aumenta el número de viajeros de la solicitud para registrar otro.</p>
      )}
      {viajeros.length > 0 && (
        <div className="tabla-contenedor">
          <table className="tabla-clientes">
            <thead><tr><th>Nombre</th><th>Relación con el cliente</th><th>Tipo</th><th>Nacimiento</th><th>Acciones</th></tr></thead>
            <tbody>
              {viajeros.map((viajero) => (
                <tr key={viajero.id}>
                  <td>{viajero.nombre}</td><td>{viajero.parentesco}</td>
                  <td>{viajero.tipo}</td><td>{viajero.nacimiento || "—"}</td>
                  <td><button disabled={busy} onClick={() => openForm(viajero)}>Editar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {form && (
        <form key={form.id || "nuevo"} className="account-form" onSubmit={submit}>
          <h3>{form.id ? "Editar viajero" : "Registrar viajero"}</h3>
          <label>Nombre<input name="nombre" required maxLength={120} defaultValue={form.nombre} /></label>
          <label>Relación con el cliente principal<input name="parentesco" required maxLength={100} defaultValue={form.parentesco} /></label>
          <label>
            Tipo
            <select name="tipo" defaultValue={form.tipo ?? "Adulto"}>
              {tipos.map((tipo) => <option key={tipo}>{tipo}</option>)}
            </select>
          </label>
          <label>
            Fecha de nacimiento (opcional)
            <input name="nacimiento" type="date" max={new Date().toISOString().slice(0, 10)} defaultValue={form.nacimiento ?? ""} />
          </label>
          {error && <p role="alert">{error}</p>}
          <div className="formulario-acciones">
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => setForm(null)}>Cancelar</button>
            <button className="btn-primary" disabled={busy}>{busy ? "Guardando…" : "Guardar viajero"}</button>
          </div>
        </form>
      )}
    </section>
  );
}

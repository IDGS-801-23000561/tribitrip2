import { useState } from "react";
import { Link, useParams } from "react-router";
import { etapas } from "../../../shared/oportunidades.js";
import { api } from "../../services/api";
import { useApiData } from "../../services/useApiData";

function Detalle({ id }) {
  const path = "/oportunidades/" + id;
  const { data, error: loadError } = useApiData(path);
  const [updated, setUpdated] = useState(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const oportunidad = updated ?? data;

  async function submit(event) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError("");
    try {
      setUpdated(await api(path, {
        method: "PUT",
        body: { ...fields, revision: oportunidad.revision },
      }));
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <Link className="btn-secondary" to="/oportunidades">Volver a oportunidades</Link>
      {loadError && <p role="alert">{loadError}</p>}
      {!oportunidad && !loadError && <p role="status">Cargando oportunidad…</p>}
      {oportunidad && (
        <>
          <h2>{oportunidad.titulo}</h2>
          <dl>
            <dt>Cliente</dt><dd>{oportunidad.cliente?.nombre ?? "—"}</dd>
            <dt>Responsable</dt><dd>{oportunidad.asesor?.nombre ?? "—"}</dd>
            <dt>Solicitud</dt><dd><Link to={"/solicitudes/" + oportunidad.solicitud}>Consultar solicitud de viaje</Link></dd>
            <dt>Etapa</dt><dd>{oportunidad.etapa}</dd>
            <dt>Resultado</dt><dd>{oportunidad.resultado ?? "Abierta"}</dd>
            {oportunidad.cerradaEn && (
              <><dt>Fecha de cierre</dt><dd>{new Date(oportunidad.cerradaEn).toLocaleString("es-MX")}</dd></>
            )}
          </dl>
          <Link className="btn-secondary" to={"/cotizaciones?oportunidad=" + id}>Consultar cotizaciones</Link>
          {editing ? (
            <form className="account-form formulario-grid" onSubmit={submit}>
              <label>Título<input name="titulo" required maxLength={120} defaultValue={oportunidad.titulo} /></label>
              <label>
                Etapa
                <select name="etapa" defaultValue={oportunidad.etapa}>
                  {etapas.map((etapa) => <option key={etapa}>{etapa}</option>)}
                </select>
              </label>
              {error && <p role="alert">{error}</p>}
              <div className="formulario-acciones">
                <button type="button" className="btn-secondary" disabled={busy} onClick={() => {
                  setEditing(false);
                  setError("");
                }}>Cancelar</button>
                <button className="btn-primary" disabled={busy}>{busy ? "Guardando…" : "Guardar cambios"}</button>
              </div>
            </form>
          ) : <button className="btn-primary" onClick={() => setEditing(true)}>Editar oportunidad</button>}
        </>
      )}
    </section>
  );
}

export default function OportunidadDetalle() {
  const { id } = useParams();
  return <Detalle key={id} id={id} />;
}

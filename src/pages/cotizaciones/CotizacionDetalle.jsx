import { useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { api } from "../../services/api";
import { useApiData } from "../../services/useApiData";
import CotizacionForm from "./CotizacionForm";
import { mostrarImporte } from "./importes";

const acciones = {
  Enviada: "Marcar como enviada",
  Aceptada: "Registrar aceptación",
  Rechazada: "Registrar rechazo",
  Vencida: "Registrar vencimiento",
};

function Detalle({ id }) {
  const location = useLocation();
  const path = "/cotizaciones/" + id;
  const { data, error } = useApiData(path);
  const [updated, setUpdated] = useState(null);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const quote = updated ?? data;
  const preview = (version) =>
    "/cotizaciones/" + id + "/versiones/" + version + "/documento";

  function adopt(saved) {
    setUpdated({
      ...saved,
      cliente: quote.cliente,
      oportunidad: quote.oportunidad,
    });
  }

  async function changeStatus() {
    setBusy(true);
    setActionError("");
    setNotice("");
    try {
      adopt(
        await api(path + "/estado", {
          method: "PATCH",
          body: { estado: pending, revision: quote.revision },
        }),
      );
      setPending(null);
      setNotice("Estado actualizado.");
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <Link className="btn-secondary" to="/cotizaciones">
        Volver a cotizaciones
      </Link>
      {error && <p role="alert">{error}</p>}
      {!quote && !error && <p role="status">Cargando cotización…</p>}
      {quote && (
        <>
          <h2>{quote.folio}</h2>
          {notice && <p role="status">{notice}</p>}
          {!notice && !editing && location.state?.creada && (
            <p role="status">Cotización guardada.</p>
          )}
          {actionError && <p role="alert">{actionError}</p>}
          <dl>
            <dt>Cliente</dt>
            <dd>{quote.cliente?.nombre ?? "—"}</dd>
            <dt>Oportunidad</dt>
            <dd>
              {quote.oportunidad ? (
                <Link to={"/oportunidades/" + quote.oportunidad._id}>
                  {quote.oportunidad.titulo}
                </Link>
              ) : (
                "—"
              )}
            </dd>
            <dt>Fecha de creación</dt>
            <dd>{new Date(quote.createdAt).toLocaleDateString("es-MX")}</dd>
            <dt>Vigencia hasta</dt>
            <dd>{quote.vigencia}</dd>
            <dt>Versión actual</dt>
            <dd>{quote.version}</dd>
            <dt>Estado</dt>
            <dd>{quote.estado}</dd>
            {quote.versionAceptada && (
              <>
                <dt>Versión aceptada</dt>
                <dd>{quote.versionAceptada}</dd>
              </>
            )}
          </dl>
          {editing ? (
            <>
              <h3>Nueva versión</h3>
              <p>
                Al guardar, se archivará la versión {quote.version} y se creará
                un borrador.
              </p>
              <CotizacionForm
                cotizacion={quote}
                onCancel={() => setEditing(false)}
                onSave={async (body) => {
                  adopt(await api(path, { method: "PUT", body }));
                  setEditing(false);
                  setNotice("Nueva versión guardada.");
                }}
              />
            </>
          ) : (
            <>
              <div className="tabla-contenedor">
                <table className="tabla-clientes">
                  <thead>
                    <tr>
                      <th>Concepto</th>
                      <th>Cantidad</th>
                      <th>Precio unitario</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.conceptos.map((item) => (
                      <tr key={item._id}>
                        <td>
                          {item.descripcion}
                          {item.referencia && (
                            <small>
                              {item.referencia.nombre}
                              {item.referencia.proveedor &&
                                " · " + item.referencia.proveedor}
                            </small>
                          )}
                        </td>
                        <td>{item.cantidad}</td>
                        <td>{mostrarImporte(item.precioUnitarioCentavos)}</td>
                        <td>{mostrarImporte(item.subtotalCentavos)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <dl>
                <dt>Subtotal</dt>
                <dd>{mostrarImporte(quote.subtotalCentavos)}</dd>
                <dt>Impuestos</dt>
                <dd>{mostrarImporte(quote.impuestosCentavos)}</dd>
                <dt>Cargos</dt>
                <dd>{mostrarImporte(quote.cargosCentavos)}</dd>
                <dt>Total</dt>
                <dd>{mostrarImporte(quote.totalCentavos)}</dd>
                <dt>Condiciones comerciales</dt>
                <dd>{quote.condiciones || "—"}</dd>
                <dt>Observaciones</dt>
                <dd>{quote.observaciones || "—"}</dd>
              </dl>
              <div className="formulario-acciones">
                <Link className="btn-secondary" to={preview(quote.version)}>
                  Ver documento imprimible
                </Link>
                {quote.estado === "Aceptada" && (
                  <Link
                    className="btn-primary"
                    to={"/reservas/nueva?cotizacion=" + id}
                  >
                    Registrar o consultar reserva
                  </Link>
                )}
                {quote.estado !== "Aceptada" && !pending && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      setNotice("");
                      setActionError("");
                      setEditing(true);
                    }}
                  >
                    Crear nueva versión
                  </button>
                )}
                {!pending &&
                  quote.transiciones.map((estado) => (
                    <button
                      key={estado}
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setActionError("");
                        setPending(estado);
                      }}
                    >
                      {acciones[estado]}
                    </button>
                  ))}
              </div>
              {pending && (
                <section className="panel">
                  <h3>{acciones[pending]}</h3>
                  {pending === "Aceptada" && (
                    <p>
                      La versión {quote.version} quedará bloqueada para edición.
                    </p>
                  )}
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={busy}
                    onClick={() => {
                      setPending(null);
                      setActionError("");
                    }}
                  >
                    Cancelar
                  </button>{" "}
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={busy}
                    onClick={changeStatus}
                  >
                    {busy ? "Guardando…" : "Confirmar cambio"}
                  </button>
                </section>
              )}
            </>
          )}
          <h3>Versiones anteriores</h3>
          {quote.versiones?.length ? (
            <ul>
              {[...quote.versiones].reverse().map(({ version, estado }) => (
                <li key={version}>
                  <Link to={preview(version)}>Ver versión {version}</Link> ·{" "}
                  {estado}
                </li>
              ))}
            </ul>
          ) : (
            <p>Aún no hay versiones anteriores.</p>
          )}
        </>
      )}
    </section>
  );
}

export default function CotizacionDetalle() {
  const { id } = useParams();
  return <Detalle key={id} id={id} />;
}

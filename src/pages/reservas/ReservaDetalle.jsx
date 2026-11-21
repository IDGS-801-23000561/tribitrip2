import { useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { api } from "../../services/api";
import { useApiData } from "../../services/useApiData";
import { mostrarImporte } from "../cotizaciones/importes";
import PagosInformativos from "./PagosInformativos";

function Detalle({ id }) {
  const path = "/reservas/" + id;
  const location = useLocation();
  const { data, error: loadError } = useApiData(path);
  const [updated, setUpdated] = useState(null);
  const [estado, setEstado] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const reserva = updated ?? data;

  async function submit(event) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setNotice("");
    setError("");
    try {
      setUpdated(
        await api(path + "/estado", {
          method: "PATCH",
          body: {
            ...fields,
            revision: reserva.revision,
            ...(estado ? { estado } : {}),
          },
        }),
      );
      setEstado("");
      setEditing(false);
      setNotice("Reserva actualizada.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="panel">
        <Link className="btn-secondary" to="/reservas">
          Volver a reservas
        </Link>
        {loadError && <p role="alert">{loadError}</p>}
        {!reserva && !loadError && <p role="status">Cargando reserva…</p>}
        {reserva && (
          <>
            <h2>{reserva.folio}</h2>
            {(notice || location.state?.registrada) && (
              <p role="status">{notice || "Reserva interna registrada."}</p>
            )}
            <dl>
              <dt>Cliente</dt>
              <dd>
                <Link to={"/reservas?cliente=" + reserva.cliente}>
                  {reserva.clienteDocumento.nombre}
                </Link>
              </dd>
              <dt>Cotización de origen</dt>
              <dd>
                <Link to={"/cotizaciones/" + reserva.cotizacion}>
                  {reserva.folioCotizacion}
                </Link>{" "}
                · versión {reserva.versionAceptada}
              </dd>
              <dt>Oportunidad</dt>
              <dd>
                <Link to={"/oportunidades/" + reserva.oportunidad}>
                  Consultar oportunidad
                </Link>
              </dd>
              <dt>Solicitud</dt>
              <dd>
                <Link to={"/solicitudes/" + reserva.solicitud}>
                  Consultar solicitud de viaje
                </Link>
              </dd>
              <dt>Destino</dt>
              <dd>{reserva.destino}</dd>
              <dt>Fechas del viaje</dt>
              <dd>
                {reserva.salida} a {reserva.regreso}
              </dd>
              <dt>Fecha de registro</dt>
              <dd>{new Date(reserva.createdAt).toLocaleDateString("es-MX")}</dd>
              <dt>Estado</dt>
              <dd>{reserva.estado}</dd>
              <dt>Localizador externo</dt>
              <dd>{reserva.localizador || "—"}</dd>
              <dt>Proveedor de referencia</dt>
              <dd>{reserva.proveedorReferencia || "—"}</dd>
            </dl>
            {editing ? (
              <form className="account-form formulario-grid" onSubmit={submit}>
                <label className="campo-ancho">
                  Nuevo estado
                  <select
                    value={estado}
                    onChange={(event) => setEstado(event.target.value)}
                  >
                    <option value="">Conservar estado actual</option>
                    {reserva.transiciones.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Localizador externo
                  <input
                    name="localizador"
                    maxLength={120}
                    defaultValue={reserva.localizador}
                  />
                </label>
                <label>
                  Proveedor de referencia
                  <input
                    name="proveedorReferencia"
                    maxLength={150}
                    defaultValue={reserva.proveedorReferencia}
                  />
                </label>
                {estado === "Cancelada" && (
                  <p>
                    La cancelación es definitiva. Los pagos informativos
                    existentes se conservan.
                  </p>
                )}
                {error && <p role="alert">{error}</p>}
                <div className="formulario-acciones">
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={busy}
                    onClick={() => {
                      setEstado("");
                      setError("");
                      setEditing(false);
                    }}
                  >
                    Cancelar edición
                  </button>
                  <button
                    className="btn-primary"
                    disabled={busy || paymentBusy}
                  >
                    {busy ? "Guardando…" : "Guardar cambios"}
                  </button>
                </div>
              </form>
            ) : (
              reserva.transiciones.length > 0 && (
                <button
                  type="button"
                  className="btn-primary"
                  disabled={paymentBusy}
                  onClick={() => setEditing(true)}
                >
                  Actualizar reserva
                </button>
              )
            )}
            <h3>Servicios acordados</h3>
            <div className="tabla-contenedor">
              <table className="tabla-clientes">
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th>Proveedor</th>
                    <th>Cantidad</th>
                    <th>Precio unitario</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {reserva.conceptos.map((item) => (
                    <tr key={item._id}>
                      <td>{item.descripcion}</td>
                      <td>{item.referencia?.proveedor || "—"}</td>
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
              <dd>{mostrarImporte(reserva.subtotalCentavos)}</dd>
              <dt>Impuestos</dt>
              <dd>{mostrarImporte(reserva.impuestosCentavos)}</dd>
              <dt>Cargos</dt>
              <dd>{mostrarImporte(reserva.cargosCentavos)}</dd>
              <dt>Condiciones comerciales</dt>
              <dd>{reserva.condiciones || "—"}</dd>
              <dt>Observaciones de la cotización</dt>
              <dd>{reserva.observaciones || "—"}</dd>
            </dl>
          </>
        )}
      </section>
      {reserva && (
        <PagosInformativos
          reserva={reserva}
          disabled={busy}
          onBusyChange={setPaymentBusy}
          onSaved={(summary) => setUpdated({ ...reserva, ...summary })}
        />
      )}
    </>
  );
}

export default function ReservaDetalle() {
  const { id } = useParams();
  return <Detalle key={id} id={id} />;
}

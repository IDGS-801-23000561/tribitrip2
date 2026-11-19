import { useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { api } from "../../services/api";
import { useApiData } from "../../services/useApiData";
import CotizacionForm from "./CotizacionForm";
import { mostrarImporte } from "./importes";

function Detalle({ id }) {
  const location = useLocation();
  const path = "/cotizaciones/" + id;
  const { data, error } = useApiData(path);
  const [updated, setUpdated] = useState(null);
  const [editing, setEditing] = useState(false);
  const quote = updated ?? data;

  return (
    <section className="panel">
      <Link to="/cotizaciones">Volver a cotizaciones</Link>
      {error && <p role="alert">{error}</p>}
      {!quote && !error && <p role="status">Cargando cotización…</p>}
      {quote && (
        <>
          <h2>{quote.folio}</h2>
          {!editing && (updated || location.state?.creada) && <p role="status">Cotización guardada.</p>}
          <dl>
            <dt>Cliente</dt><dd>{quote.cliente?.nombre ?? "—"}</dd>
            <dt>Oportunidad</dt>
            <dd>{quote.oportunidad
              ? <Link to={"/oportunidades/" + quote.oportunidad._id}>{quote.oportunidad.titulo}</Link>
              : "—"}</dd>
            <dt>Fecha de creación</dt><dd>{new Date(quote.createdAt).toLocaleDateString("es-MX")}</dd>
            <dt>Vigencia hasta</dt><dd>{quote.vigencia}</dd>
          </dl>
          {editing ? (
            <CotizacionForm cotizacion={quote} onCancel={() => setEditing(false)} onSave={async (body) => {
              const saved = await api(path, { method: "PUT", body });
              setUpdated({ ...saved, cliente: quote.cliente, oportunidad: quote.oportunidad });
              setEditing(false);
            }} />
          ) : (
            <>
              <div className="tabla-contenedor">
                <table className="tabla-clientes">
                  <thead><tr><th>Concepto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead>
                  <tbody>
                    {quote.conceptos.map((item) => (
                      <tr key={item._id}>
                        <td>{item.descripcion}{item.referencia && <small>{item.referencia.nombre}{item.referencia.proveedor && " · " + item.referencia.proveedor}</small>}</td>
                        <td>{item.cantidad}</td>
                        <td>{mostrarImporte(item.precioUnitarioCentavos)}</td>
                        <td>{mostrarImporte(item.subtotalCentavos)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <dl>
                <dt>Subtotal</dt><dd>{mostrarImporte(quote.subtotalCentavos)}</dd>
                <dt>Impuestos</dt><dd>{mostrarImporte(quote.impuestosCentavos)}</dd>
                <dt>Cargos</dt><dd>{mostrarImporte(quote.cargosCentavos)}</dd>
                <dt>Total</dt><dd>{mostrarImporte(quote.totalCentavos)}</dd>
                <dt>Condiciones comerciales</dt><dd>{quote.condiciones || "—"}</dd>
                <dt>Observaciones</dt><dd>{quote.observaciones || "—"}</dd>
              </dl>
              <button type="button" className="btn-primary" onClick={() => setEditing(true)}>Editar cotización</button>
            </>
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

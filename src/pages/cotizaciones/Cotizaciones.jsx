import { Link, useSearchParams } from "react-router";
import { useApiData } from "../../services/useApiData";
import { mostrarImporte } from "./importes";

export default function Cotizaciones() {
  const [params] = useSearchParams();
  const oportunidad = params.get("oportunidad");
  const path = oportunidad
    ? "/oportunidades/" + encodeURIComponent(oportunidad) + "/cotizaciones"
    : "/cotizaciones";
  const { data, error } = useApiData(path);
  return (
    <section className="panel">
      <h2>{oportunidad ? "Cotizaciones de la oportunidad" : "Cotizaciones registradas"}</h2>
      <div className="formulario-acciones">
        <Link to={oportunidad ? "nueva?oportunidad=" + encodeURIComponent(oportunidad) : "nueva"}>Nueva cotización</Link>
        <Link to="catalogo">Catálogo de servicios</Link>
        {oportunidad && <Link to="/cotizaciones">Ver todas</Link>}
      </div>
      {error && <p role="alert">{error}</p>}
      {!data && !error && <p role="status">Cargando cotizaciones…</p>}
      {data?.length === 0 && <p>No hay cotizaciones registradas.</p>}
      {data?.length > 0 && (
        <div className="tabla-contenedor">
          <table className="tabla-clientes">
            <thead><tr><th>Folio</th><th>Cliente</th><th>Oportunidad</th><th>Vigencia</th><th>Total</th></tr></thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  <td><Link to={item.id}>{item.folio}</Link></td>
                  <td>{item.cliente?.nombre}</td><td>{item.oportunidad?.titulo}</td>
                  <td>{item.vigencia}</td><td>{mostrarImporte(item.totalCentavos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

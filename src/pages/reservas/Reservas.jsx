import { Link, useSearchParams } from "react-router";
import { useApiData } from "../../services/useApiData";
import { mostrarImporte } from "../cotizaciones/importes";

export default function Reservas() {
  const [params] = useSearchParams();
  const cliente = params.get("cliente");
  const clientPath = cliente ? "/clientes/" + encodeURIComponent(cliente) : null;
  const { data: contacto } = useApiData(clientPath);
  const { data, error } = useApiData(clientPath ? clientPath + "/reservas" : "/reservas");

  return (
    <section className="panel">
      <h2>{cliente ? "Historial de reservas del cliente" : "Reservas registradas"}</h2>
      {contacto && <p>{contacto.nombre}</p>}
      <div className="formulario-acciones">
        <Link to="nueva">Nueva reserva</Link>
        {cliente && <Link to="/clientes">Volver a clientes</Link>}
      </div>
      {error && <p role="alert">{error}</p>}
      {!data && !error && <p role="status">Cargando reservas…</p>}
      {data?.length === 0 && <p>No hay reservas registradas.</p>}
      {data?.length > 0 && (
        <div className="tabla-contenedor">
          <table className="tabla-clientes">
            <thead><tr><th>Folio</th><th>Cliente</th><th>Destino</th><th>Salida</th><th>Estado</th><th>Importe acordado</th></tr></thead>
            <tbody>
              {data.map((reserva) => (
                <tr key={reserva.id}>
                  <td><Link to={reserva.id}>{reserva.folio}</Link></td>
                  <td>{reserva.clienteDocumento.nombre}</td><td>{reserva.destino}</td>
                  <td>{reserva.salida}</td><td>{reserva.estado}</td>
                  <td>{mostrarImporte(reserva.totalCentavos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

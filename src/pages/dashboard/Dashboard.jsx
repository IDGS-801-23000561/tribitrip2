import { Link } from "react-router";
import { useSession } from "../../auth/session";
import { useApiData } from "../../services/useApiData";
import { mostrarImporte } from "../cotizaciones/importes";

const percent = new Intl.NumberFormat("es-MX", { style: "percent", maximumFractionDigits: 1 });

export default function Dashboard() {
  const { usuario } = useSession();
  const admin = usuario.rol === "Administrador";
  const { data, error } = useApiData(admin ? "/dashboard" : null);
  if (!admin) return (
    <section className="panel">
      <h2>Bienvenido, {usuario.nombre}</h2>
      <ul>
        <li><Link to="/clientes">Consultar tus clientes y prospectos</Link></li>
        <li><Link to="/solicitudes">Consultar tus solicitudes de viaje</Link></li>
        <li><Link to="/oportunidades">Consultar tus oportunidades</Link></li>
      </ul>
    </section>
  );
  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p role="status">Cargando indicadores…</p>;

  const cards = [
    ["Clientes registrados", data.clientes, "Activos e inactivos"],
    ["Prospectos", data.prospectos],
    ["Oportunidades abiertas", data.abiertas],
    ["Oportunidades ganadas", data.ganadas],
    ["Oportunidades perdidas", data.perdidas],
    ["Conversión", percent.format(data.conversion), "Ganadas entre ganadas y perdidas"],
    ["Ventas registradas", mostrarImporte(data.ventasCentavos), data.reservas + " reservas no canceladas"],
  ];
  const stages = cards.slice(2, 5);
  const total = data.abiertas + data.ganadas + data.perdidas;
  return (
    <div className="dashboard">
      <div className="bienvenida">
        <h2>Indicadores comerciales</h2>
        <Link to="/reportes">Consultar reportes por periodo</Link>
      </div>
      {!total && !data.clientes && !data.prospectos && !data.reservas && <p>Aún no hay registros comerciales.</p>}
      <div className="indicadores">
        {cards.map(([title, value, note]) => (
          <article className="indicador-card" key={title}>
            <span>{title}</span><strong>{value}</strong>{note && <small>{note}</small>}
          </article>
        ))}
      </div>
      {total > 0 && (
        <section className="panel">
          <h3>Distribución de oportunidades</h3>
          <ul>
            {stages.map(([title, value]) => (
              <li key={title}>{title} <meter aria-label={title} min={0} max={total} value={value} /> {value}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

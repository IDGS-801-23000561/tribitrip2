import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api } from "../../services/api";
import SolicitudForm from "./SolicitudForm";
import Viajeros from "./Viajeros";

const moneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

function Detalle({ id }) {
  const [solicitud, setSolicitud] = useState(null);
  const [editando, setEditando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api("/solicitudes/" + id)
      .then((data) => { if (active) setSolicitud(data); })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [id]);

  return (
    <>
      <section className="panel">
        <Link className="btn-secondary" to="/solicitudes">Volver a solicitudes</Link>
        {error && <p role="alert">{error}</p>}
        {!solicitud && !error && <p role="status">Cargando solicitud…</p>}
        {solicitud && (
          <>
            <h2>{solicitud.destino}</h2>
            <dl>
              <dt>Cliente</dt><dd>{solicitud.cliente.nombre}</dd>
              <dt>Estado</dt><dd>{solicitud.estado}</dd>
              <dt>Salida y regreso</dt><dd>{solicitud.salida} a {solicitud.regreso}</dd>
              <dt>Presupuesto (MXN)</dt><dd>{moneda.format(solicitud.presupuesto)}</dd>
              <dt>Número de viajeros</dt><dd>{solicitud.cantidadViajeros}</dd>
              <dt>Necesidades específicas</dt><dd>{solicitud.necesidades || "—"}</dd>
            </dl>
            {editando ? (
              <SolicitudForm solicitud={solicitud} onCancel={() => setEditando(false)} onSave={async (body) => {
                setSolicitud(await api("/solicitudes/" + id, { method: "PUT", body }));
                setEditando(false);
              }} />
            ) : <button className="btn-primary" onClick={() => setEditando(true)}>Editar solicitud</button>}
          </>
        )}
      </section>
      {solicitud && !editando && <Viajeros solicitud={solicitud} onSaved={setSolicitud} onEditCapacity={() => setEditando(true)} />}
    </>
  );
}

export default function SolicitudDetalle() {
  const { id } = useParams();
  return <Detalle key={id} id={id} />;
}

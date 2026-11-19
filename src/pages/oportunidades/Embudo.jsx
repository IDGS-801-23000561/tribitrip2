import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { estados } from "../../../shared/oportunidades.js";
import { useApiData } from "../../services/useApiData";
import "./embudo.css";

function Etapas({ query }) {
  const { data: grupos, error } = useApiData("/oportunidades/embudo?" + query);
  if (error) return <p role="alert">{error}</p>;
  if (!grupos) return <p role="status">Cargando embudo…</p>;
  return (
    <>
      {grupos.every(({ cantidad }) => cantidad === 0) && <p>No hay oportunidades para estos filtros.</p>}
      <div className="embudo">
        {grupos.map(({ etapa, cantidad, oportunidades }) => (
          <section className="embudo-etapa" key={etapa}>
            <h3>{etapa} ({cantidad})</h3>
            {cantidad === 0 ? <p>Sin oportunidades</p> : (
              <ul>
                {oportunidades.map(({ id, titulo, cliente, asesor }) => (
                  <li key={id}>
                    <Link to={"/oportunidades/" + id}>{titulo}</Link>
                    <small>{cliente?.nombre} · {asesor?.nombre}</small>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </>
  );
}

export default function Embudo() {
  const [params, setParams] = useSearchParams();
  const [refresh, setRefresh] = useState(0);
  const { data: usuarios, error } = useApiData("/usuarios");
  function filter(key, value) {
    const query = new URLSearchParams(params);
    if (value) query.set(key, value);
    else query.delete(key);
    setParams(query);
  }

  return (
    <section className="panel">
      <h2>Embudo de ventas</h2>
      <div className="account-form">
        <label>
          Asesor responsable
          <select value={params.get("asesor") || ""} disabled={!usuarios} onChange={(event) => filter("asesor", event.target.value)}>
            <option value="">Todos los responsables</option>
            {usuarios?.map(({ id, nombre }) => <option key={id} value={id}>{nombre}</option>)}
          </select>
        </label>
        {error && <p role="alert">{error}</p>}
        <label>
          Estado
          <select value={params.get("estado") || ""} onChange={(event) => filter("estado", event.target.value)}>
            <option value="">Todos los estados</option>
            {estados.map((estado) => <option key={estado}>{estado}</option>)}
          </select>
        </label>
      </div>
      <button type="button" className="btn-secondary" onClick={() => setRefresh((value) => value + 1)}>
        Actualizar embudo
      </button>
      <Etapas key={params.toString() + ":" + refresh} query={params.toString()} />
    </section>
  );
}

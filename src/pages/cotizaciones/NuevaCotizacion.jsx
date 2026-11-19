import { Link, useNavigate, useSearchParams } from "react-router";
import { api } from "../../services/api";
import { useApiData } from "../../services/useApiData";
import CotizacionForm from "./CotizacionForm";

export default function NuevaCotizacion() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const serviceId = params.get("servicio");
  const opportunityId = params.get("oportunidad");
  const { data: servicio, error: errorServicio } = useApiData(serviceId ? "/servicios-turisticos/" + encodeURIComponent(serviceId) : null);
  const { data: oportunidades, error } = useApiData("/oportunidades");
  const opciones = oportunidades?.filter((item) => item.cliente);
  const oportunidadInicial = opciones?.find(({ id }) => id === opportunityId);

  return (
    <section className="panel">
      <h2>Nueva cotización</h2>
      {(error || errorServicio) && <p role="alert">{error || errorServicio}</p>}
      {opciones && opportunityId && !oportunidadInicial && <p role="alert">La oportunidad seleccionada no está disponible.</p>}
      {(!opciones || (serviceId && !servicio)) && !error && !errorServicio && <p role="status">Cargando datos…</p>}
      {opciones?.length === 0 && <p>Registra una <Link to="/oportunidades">oportunidad comercial</Link> para continuar.</p>}
      <Link to="/cotizaciones">Volver a cotizaciones</Link>
      {opciones?.length > 0 && (!serviceId || servicio) && (
        <CotizacionForm
          key={params.toString()}
          oportunidades={opciones}
          servicioInicial={servicio}
          oportunidadInicial={oportunidadInicial}
          onCancel={() => navigate("/cotizaciones")}
          onSave={async (body) => {
            const saved = await api("/cotizaciones", { method: "POST", body });
            navigate("/cotizaciones/" + saved.id, { replace: true, state: { creada: true } });
          }}
        />
      )}
    </section>
  );
}

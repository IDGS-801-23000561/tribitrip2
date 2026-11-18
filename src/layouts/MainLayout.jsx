
import { Outlet, useLocation } from "react-router";
import { useState } from "react";
import { useSession } from "../auth/session";
import Sidebar from "../components/Sidebar";

const titulos = {
  "/dashboard": "Dashboard",
  "/clientes": "Clientes y prospectos",
  "/solicitudes": "Solicitudes de viaje",
  "/oportunidades": "Oportunidades comerciales",
  "/cotizaciones": "Cotizaciones",
  "/reservas": "Reservas",
  "/actividades": "Seguimiento de actividades",
};

function MainLayout() {
  const location = useLocation();
  const { usuario, logout } = useSession();
  const [error, setError] = useState("");
  const titulo = titulos[location.pathname] || "TribiTrip";

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-container">
        <header className="main-header">
          <div>
            <span className="header-subtitulo">
              TribiTrip / CRM
            </span>
            <h1>{titulo}</h1>
          </div>

          <div className="usuario">
            <span className="usuario-avatar">{usuario.nombre.slice(0, 1)}</span>
            <div>
              <strong>{usuario.nombre}</strong>
              <small>{usuario.rol}</small>
            </div>
          </div>
        <button className="btn-secondary" onClick={async () => { try { await logout(); } catch (e) { setError(e.message); } }}>Cerrar sesion</button>
        </header>

        <main className="main-content">
          {error && <p role="alert">{error}</p>}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;

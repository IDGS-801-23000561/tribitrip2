import { Navigate, Outlet, Route, Routes } from "react-router";
import MainLayout from "../layouts/MainLayout";
import Dashboard from "../pages/dashboard/Dashboard";
import Clientes from "../pages/clientes/Clientes";
import Login from "../pages/Login";
import Usuarios from "../pages/Usuarios";
import { useSession } from "../auth/session";
function PrivateRoute() {
  const { usuario, cargando } = useSession();
  if (cargando) return <p role="status">Verificando sesión…</p>;
  return usuario ? <Outlet /> : <Navigate to="/login" replace />;
}
function AdminRoute() {
  const { usuario } = useSession();
  return usuario?.rol === "Administrador" ? (
    <Usuarios />
  ) : (
    <Navigate to="/dashboard" replace />
  );
}
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="usuarios" element={<AdminRoute />} />
          {["solicitudes", "oportunidades", "cotizaciones", "reservas"].map(
            (path) => (
              <Route
                key={path}
                path={path}
                element={
                  <section className="panel">
                    <h2>{path}</h2>
                    <p>Este módulo se encuentra en desarrollo.</p>
                  </section>
                }
              />
            ),
          )}
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

import { useEffect, useState } from "react";
import { api } from "../services/api";
const initial = {
  nombre: "",
  correo: "",
  rol: "Asesor",
  activo: true,
  password: "",
};
export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(initial);
  const [id, setId] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    api("/usuarios")
      .then((data) => {
        if (active) setUsuarios(data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/usuarios" + (id ? "/" + id : ""), {
        method: id ? "PUT" : "POST",
        body: form,
      });
      setUsuarios(await api("/usuarios"));
      setForm(initial);
      setId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <h2>Usuarios y roles</h2>
      {error && <p role="alert">{error}</p>}
      <form onSubmit={submit} className="account-form">
        {["nombre", "correo", "password"].map((field) => (
          <label key={field}>
            {field === "password"
              ? id
                ? "Nueva contraseña (opcional)"
                : "Contraseña"
              : field === "correo"
                ? "Correo"
                : "Nombre"}
            <input
              type={
                field === "password"
                  ? "password"
                  : field === "correo"
                    ? "email"
                    : "text"
              }
              value={form[field]}
              required={field !== "password" || !id}
              minLength={field === "password" ? 12 : undefined}
              maxLength={field === "password" ? 128 : 254}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            />
          </label>
        ))}
        <label>
          Rol
          <select
            value={form.rol}
            onChange={(e) => setForm({ ...form, rol: e.target.value })}
          >
            <option>Asesor</option>
            <option>Administrador</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(e) => setForm({ ...form, activo: e.target.checked })}
          />{" "}
          Cuenta activa
        </label>
        <button className="btn-primary" disabled={busy}>
          {busy ? "Guardando…" : id ? "Guardar cambios" : "Crear usuario"}
        </button>
        {id && (
          <button
            type="button"
            onClick={() => {
              setId(null);
              setForm(initial);
            }}
          >
            Cancelar edición
          </button>
        )}
      </form>
      <div className="tabla-contenedor">
        <table className="tabla-clientes">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.nombre}</td>
                <td>{u.correo}</td>
                <td>{u.rol}</td>
                <td>{u.activo ? "Activo" : "Inactivo"}</td>
                <td>
                  <button
                    onClick={() => {
                      setId(u.id);
                      setForm({
                        nombre: u.nombre,
                        correo: u.correo,
                        rol: u.rol,
                        activo: u.activo,
                        password: "",
                      });
                    }}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

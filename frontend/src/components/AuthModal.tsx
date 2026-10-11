import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { useStore } from "../store/useStore";
import { Ghost } from "lucide-react";

export function AuthModal() {
  const { login, register } = useApi();
  const setAuth = useStore((s) => s.setAuth);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setError("");
    setLoading(true);
    try {
      const data =
        mode === "login"
          ? await login(form.email, form.password)
          : await register(form.email, form.password, form.name);
      setAuth(data.user, data.token);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error || "Error al conectar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-violet-400 mb-3">
            <Ghost size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Finanzas Fantasma</h1>
          <p className="text-slate-400 text-sm mt-1">Inversiones simuladas en tiempo real</p>
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-4">
          <div className="flex rounded-lg bg-white/5 p-1">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-1.5 rounded-md text-sm transition-all ${
                  mode === m ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {m === "login" ? "Entrar" : "Registrarse"}
              </button>
            ))}
          </div>

          {mode === "register" && (
            <input
              className="input-dark w-full"
              placeholder="Nombre"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          )}
          <input
            type="email"
            className="input-dark w-full"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password"
            className="input-dark w-full"
            placeholder="Contraseña"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && handle()}
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button onClick={handle} disabled={loading} className="btn-primary w-full">
            {loading ? "Cargando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </div>
      </div>
    </div>
  );
}

import { Bell, X } from "lucide-react";
import { useState } from "react";
import { useStore } from "../store/useStore";

export function NotificationBell() {
  const notifications = useStore((s) => s.notifications);
  const clearNotifications = useStore((s) => s.clearNotifications);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-400 hover:text-white transition-colors"
      >
        <Bell size={18} />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <p className="text-sm font-medium text-white">Alertas disparadas</p>
            {notifications.length > 0 && (
              <button onClick={clearNotifications} className="text-xs text-slate-400 hover:text-white">
                Limpiar
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">Sin notificaciones</p>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
              {notifications.map((n, i) => (
                <div key={i} className="px-4 py-3">
                  <p className="text-sm text-white">{n.message.replace(/\*/g, "")}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(n.timestamp).toLocaleString("es-EC")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

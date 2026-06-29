// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: SuperadminLayout
// FUNÇÃO: Layout base das páginas de superadmin. Reaproveita o GestorLayout,
//         exibe um submenu lateral interno para UBSs, Gestores e Logs, e
//         mantém o acesso restrito ao perfil "admin" via roteamento protegido.
// ─────────────────────────────────────────────────────────────────────────────
import { NavLink, Outlet } from 'react-router-dom';
import GestorLayout from '../../../components/gestor/GestorLayout';

const SUBMENU = [
  { to: '/gestor/admin/ubs', label: 'UBSs', icon: 'apartment' },
  { to: '/gestor/admin/gestores', label: 'Gestores', icon: 'manage_accounts' },
  { to: '/gestor/admin/logs', label: 'Logs', icon: 'receipt_long' },
];

export default function SuperadminLayout() {
  return (
    <GestorLayout>
      <div className="space-y-6">
        <header className="rounded-[2rem] border border-surface-variant/40 bg-surface-container-lowest p-6 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">
            Superadmin
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-on-background md:text-4xl">
            Administração da Rede
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-medium text-on-surface-variant md:text-base">
            Cadastro central de UBSs, onboarding de gestores reais e consulta da
            trilha de auditoria sem acessar o banco manualmente.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-[2rem] border border-surface-variant/40 bg-surface-container-lowest p-4 shadow-sm">
            <p className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-on-surface-variant/70">
              Administração
            </p>
            <nav className="space-y-2">
              {SUBMENU.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </aside>

          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </GestorLayout>
  );
}

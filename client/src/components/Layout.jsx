import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  UserRound,
  Tags,
  ListChecks,
  ClipboardList,
  FolderOpen,
  FileCheck2,
  PlayCircle,
  History,
  Menu,
  X,
  LogOut,
  Baby,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';

export default function Layout() {
  const { profile, logout, isAdmin, isCoach } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const ADMIN_LINKS = [
    { to: '/admin', label: t('nav.dashboard'), end: true, icon: LayoutDashboard },
    { to: '/admin/coaches', label: t('nav.coaches'), icon: Users },
    { to: '/admin/admins', label: t('nav.admins'), icon: ShieldCheck },
    { to: '/admin/parents', label: t('nav.parents'), icon: Baby },
    { to: '/admin/athletes', label: t('nav.athletes'), icon: UserRound },
    { to: '/admin/categories', label: t('nav.categories'), icon: Tags },
    { to: '/admin/session-types', label: t('nav.sessionTypes'), icon: ListChecks },
    { to: '/admin/attendance', label: t('nav.attendanceHistory'), icon: ClipboardList },
    { to: '/admin/folders', label: t('nav.documentFolders'), icon: FolderOpen },
    { to: '/admin/documents', label: t('nav.athleteDocuments'), icon: FileCheck2 },
  ];

  const COACH_LINKS = [
    { to: '/coach', label: t('nav.dashboard'), end: true, icon: LayoutDashboard },
    { to: '/coach/attendance/start', label: t('nav.startAttendance'), icon: PlayCircle },
    { to: '/coach/attendance/history', label: t('nav.attendanceHistory'), icon: History },
    { to: '/coach/athletes', label: t('nav.myAthletes'), icon: UserRound },
    { to: '/coach/documents', label: t('nav.documentChecklist'), icon: FileCheck2 },
  ];

  const PARENT_LINKS = [{ to: '/parent', label: t('nav.dashboard'), end: true, icon: LayoutDashboard }];

  const links = isAdmin ? ADMIN_LINKS : isCoach ? COACH_LINKS : PARENT_LINKS;

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-cream md:flex">
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-ink text-cream px-4 py-3 shadow-md">
        <div className="flex items-center gap-2">
          <FennecMark size={28} />
          <p className="font-display text-base leading-none">{t('app.name')}</p>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 hover:bg-white/10"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
        >
          <Menu size={22} />
        </button>
      </div>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 start-0 z-50
          w-72 md:w-64 shrink-0 bg-ink text-cream flex flex-col
          transform transition-transform duration-200 ease-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'}
          md:translate-x-0 md:rtl:translate-x-0
        `}
      >
        <div className="px-5 py-6 flex items-center justify-between gap-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <FennecMark />
            <div>
              <p className="font-display text-lg leading-none">{t('app.name')}</p>
              <p className="text-xs text-dune-300 mt-1">
                {isAdmin ? t('nav.adminWorkspace') : isCoach ? t('nav.coachWorkspace') : t('nav.parentWorkspace')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden rounded-lg p-1 text-dune-300 hover:bg-white/10 hover:text-cream"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-3 border-b border-white/10">
          <LanguageSwitcher variant="dark" />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-fennec-500 text-white shadow-sm'
                      : 'text-dune-100 hover:bg-white/10'
                  }`
                }
              >
                <Icon size={18} className="shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <p className="px-3 text-xs text-dune-300 truncate">{profile?.full_name}</p>
          <p className="px-3 text-xs text-dune-300 truncate mb-3">{profile?.email}</p>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-cream hover:bg-white/10 transition-colors"
          >
            <LogOut size={16} />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function FennecMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="22" r="12" fill="#C81E3A" />
      <path d="M9 12 L15 22 L11 24Z" fill="#C81E3A" />
      <path d="M31 12 L25 22 L29 24Z" fill="#C81E3A" />
      <path d="M9 12 L14 20 L12 21Z" fill="#241416" />
      <path d="M31 12 L26 20 L28 21Z" fill="#241416" />
      <circle cx="16" cy="21" r="1.4" fill="#241416" />
      <circle cx="24" cy="21" r="1.4" fill="#241416" />
      <path d="M18.5 26 L21.5 26 L20 28Z" fill="#241416" />
    </svg>
  );
}

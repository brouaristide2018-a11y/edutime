import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  CalendarDays, 
  Clock, 
  Banknote,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LifeBuoy,
  FileText,
  Home,
  QrCode
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { useStore } from '../store';
import { ConfirmModal } from './ConfirmModal';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navigation = [
  { name: 'Accueil', href: '/admin', icon: Home, end: true },
  { name: 'Tableau de bord', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Professeurs', href: '/admin/professors', icon: Users },
  { name: 'Classes & Matières', href: '/admin/classes', icon: BookOpen },
  { 
    name: 'Planning', 
    icon: CalendarDays,
    children: [
      { name: 'Planning', href: '/admin/schedule' },
      { name: 'Emploi du temps Professeur', href: '/admin/timetable' },
      { name: 'Emploi du temps Classe', href: '/admin/timetable-class' }
    ]
  },
  { name: 'Pointage', href: '/admin/attendance', icon: Clock },
  { name: 'Demandes', href: '/admin/requests', icon: FileText },
  { name: 'Heures & Paie', href: '/admin/payroll', icon: Banknote },
  { name: 'Support', href: '/admin/support', icon: LifeBuoy },
];

import { SubscriptionChecker } from './SubscriptionChecker';

export function Layout() {
  const settings = useStore((state) => state.settings);
  const platformSettings = useStore((state) => state.platformSettings);
  const currentUser = useStore((state) => state.currentUser);
  const logout = useStore((state) => state.logout);
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const filteredNavigation = navigation.filter(item => {
    if (!settings.modules) return true;
    switch (item.name) {
      case 'Professeurs': return settings.modules.professors !== false;
      case 'Classes & Matières': return settings.modules.classes !== false;
      case 'Planning': return settings.modules.schedule !== false;
      case 'Pointage': return settings.modules.attendance !== false;
      case 'Demandes': return settings.modules.requests !== false;
      case 'Heures & Paie': return settings.modules.payroll !== false;
      case 'Support': return settings.modules.support !== false;
      default: return true;
    }
  });

  return (
    <SubscriptionChecker>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-30 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out lg:static lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className={cn("flex items-center gap-2 text-indigo-600", isCollapsed && "justify-center w-full")}>
            {platformSettings?.publicSite?.logoUrl ? (
              <img src={platformSettings.publicSite.logoUrl} alt="EduTime Logo" className="w-8 h-8 object-contain" />
            ) : (
              <Clock className="w-6 h-6 flex-shrink-0" />
            )}
            {!isCollapsed && <span className="text-xl font-bold tracking-tight truncate">EduTime</span>}
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-700 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto overflow-x-hidden">
          {navigation.map((item) => (
            item.children ? (
              <div key={item.name} className="space-y-1">
                <button
                  onClick={() => {
                    setExpandedMenu(expandedMenu === item.name ? null : item.name);
                    if (isCollapsed) setIsCollapsed(false);
                  }}
                  className={cn(
                    'flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    expandedMenu === item.name || item.children.some(c => location.pathname === c.href)
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                    isCollapsed && "justify-center px-0"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown className={cn("w-4 h-4 transition-transform", expandedMenu === item.name && "rotate-180")} />
                  )}
                </button>
                {expandedMenu === item.name && !isCollapsed && (
                  <div className="pl-11 pr-3 space-y-1">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.name}
                        to={child.href}
                        onClick={() => {
                          setIsSidebarOpen(false);
                          setExpandedMenu(null);
                        }}
                        className={({ isActive }) =>
                          cn(
                            'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          )
                        }
                      >
                        {child.name}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                key={item.name}
                to={item.href!}
                end={item.end}
                onClick={() => {
                  setIsSidebarOpen(false);
                  setExpandedMenu(null);
                }}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                    isCollapsed && "justify-center px-0"
                  )
                }
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            )
          ))}
        </nav>
        <div className="p-3 border-t border-gray-200">
          <div className={cn("flex items-center gap-3 mb-4 px-2", isCollapsed && "justify-center px-0")}>
            {settings?.logo ? (
              <img src={settings.logo} alt="School Logo" className="w-8 h-8 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium flex-shrink-0">
                {currentUser?.name.charAt(0)}
              </div>
            )}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{currentUser?.name}</p>
                <p className="text-xs text-gray-500 truncate">{currentUser?.role}</p>
              </div>
            )}
          </div>
          <NavLink
            to="/admin/settings"
            onClick={() => {
              setIsSidebarOpen(false);
              setExpandedMenu(null);
            }}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium transition-colors mb-2',
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                isCollapsed && "justify-center px-0"
              )
            }
            title={isCollapsed ? "Paramètres" : undefined}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="truncate">Paramètres</span>}
          </NavLink>
          <button 
            onClick={() => {
              setExpandedMenu(null);
              setIsLogoutModalOpen(true);
            }}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors",
              isCollapsed && "justify-center px-0"
            )}
            title={isCollapsed ? "Déconnexion" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="truncate">Déconnexion</span>}
          </button>
        </div>
        
        {/* Desktop collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex items-center justify-center h-10 border-t border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-700 lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {settings?.schoolName || 'EduTime'}
            </h1>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={logout}
        title="Déconnexion"
        message="Êtes-vous sûr de vouloir vous déconnecter ?"
        confirmText="Se déconnecter"
        cancelText="Annuler"
      />
    </div>
    </SubscriptionChecker>
  );
}

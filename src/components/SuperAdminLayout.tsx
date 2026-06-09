import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { Shield, Building2, LogOut, Home, CreditCard, LifeBuoy, Megaphone, ChevronDown, ChevronRight, School, Settings } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

export function SuperAdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useStore(state => state.logout);
  const syncSuperAdmin = useStore(state => state.syncSuperAdmin);

  // Synchroniser les données super admin depuis l'API au chargement
  useEffect(() => {
    syncSuperAdmin().catch(() => {});
  }, []);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isEtablissementsExpanded, setIsEtablissementsExpanded] = useState(
    location.pathname.includes('/super-admin/inscriptions') || location.pathname.includes('/super-admin/etablissements')
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 flex items-center gap-3 border-b border-slate-800">
          <Shield className="w-8 h-8 text-indigo-400" />
          <span className="font-bold text-lg">Super Admin</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/super-admin" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === '/super-admin' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
            <Home className="w-5 h-5" />
            Accueil
          </Link>
          
          {/* Menu déroulant pour la gestion des établissements */}
          <div className="space-y-1">
            <button 
              onClick={() => setIsEtablissementsExpanded(!isEtablissementsExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors text-slate-300 hover:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5" />
                <span>Établissements</span>
              </div>
              {isEtablissementsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {isEtablissementsExpanded && (
              <div className="pl-11 pr-2 space-y-1 py-1">
                <Link to="/super-admin/inscriptions" className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${location.pathname === '/super-admin/inscriptions' ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                  Validations
                </Link>
                <Link to="/super-admin/etablissements" className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${location.pathname === '/super-admin/etablissements' ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                  Gestion Établissements
                </Link>
              </div>
            )}
          </div>

          <Link to="/super-admin/abonnements" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === '/super-admin/abonnements' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
            <CreditCard className="w-5 h-5" />
            Abonnements
          </Link>
          <Link to="/super-admin/annonces" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === '/super-admin/annonces' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
            <Megaphone className="w-5 h-5" />
            Annonces & Pubs
          </Link>
          <Link to="/super-admin/supports" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === '/super-admin/supports' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
            <LifeBuoy className="w-5 h-5" />
            Supports
          </Link>
          <Link to="/super-admin/parametres" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === '/super-admin/parametres' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
            <Settings className="w-5 h-5" />
            Paramètres
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={() => setIsLogoutModalOpen(true)} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-slate-800 transition-colors">
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Déconnexion"
        message="Êtes-vous sûr de vouloir vous déconnecter ?"
        confirmText="Se déconnecter"
        cancelText="Annuler"
      />
    </div>
  );
}

import React, { useState } from 'react';
import { useStore } from '../../store';
import { Building2, Clock, CheckCircle, Banknote, MessageSquare, Users, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';

export function SuperAdminHome() {
  const registrations = useStore(state => state.registrations);
  const users = useStore(state => state.users);
  const supportTickets = useStore(state => state.supportTickets);

  const [isWiping, setIsWiping] = useState(false);

  const totalSchools = registrations.filter(r => r.status === 'Validé').length;
  const pendingSchools = registrations.filter(r => r.status === 'En attente').length;
  const activeTickets = supportTickets.filter(t => t.status === 'Ouvert').length;
  const totalRevenue = totalSchools * 15000;
  const totalUsers = users.length;

  const handleWipeData = () => {
    if (!window.confirm("Êtes-vous ABSOLUMENT sûr ? Cette action supprimera TOUTES les données opérationnelles (professeurs, classes, cours, paiements, etc.) et ne pourra pas être annulée.")) {
      return;
    }

    setIsWiping(true);
    try {
      useStore.setState({
        professors: [],
        classes: [],
        subjects: [],
        courses: [],
        attendances: [],
        payments: [],
        rooms: [],
        timeSlots: [],
        professorRequests: [],
        registrations: [],
        supportTickets: [],
      });
      // Keep admins and superadmins
      const currentUsers = useStore.getState().users;
      const keptUsers = currentUsers.filter(u => u.role === 'SuperAdmin' || u.role === 'Admin');
      useStore.setState({ users: keptUsers });

      alert("Nettoyage terminé avec succès ! L'application est maintenant vide de données opérationnelles.");
    } catch (error) {
      console.error("Error wiping data:", error);
      alert("Une erreur est survenue lors du nettoyage.");
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vue d'ensemble</h1>
        <button
          onClick={handleWipeData}
          disabled={isWiping}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium border border-red-200"
        >
          {isWiping ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
          {isWiping ? "Nettoyage en cours..." : "Réinitialiser les données"}
        </button>
      </div>

      {isWiping && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-amber-500 flex-shrink-0" size={24} />
          <div>
            <h3 className="text-amber-800 font-semibold italic">Opération sensible en cours</h3>
            <p className="text-amber-700 text-sm">Nous nettoyons les bases de données. Veuillez ne pas fermer cette fenêtre.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
              <Building2 size={24} />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Établissements Validés</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalSchools}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600">
              <Clock size={24} />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Inscriptions en Attente</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">{pendingSchools}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
              <Banknote size={24} />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Revenus (Estimés)</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalRevenue.toLocaleString()} FCFA</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
              <MessageSquare size={24} />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Tickets Support Ouverts</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">{activeTickets}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="text-indigo-600" size={20} />
            Utilisateurs de la plateforme
          </h2>
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <p className="text-4xl font-bold text-indigo-600">{totalUsers}</p>
              <p className="text-gray-500 mt-2">Comptes enregistrés au total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Banknote className="text-emerald-600" size={20} />
            Aperçu Financier
          </h2>
          <div className="flex items-center justify-center h-48">
            <p className="text-gray-500 text-center italic">
              Le module financier est maintenant prêt pour une nouvelle configuration propre.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

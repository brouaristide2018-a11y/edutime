import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Building2, Clock, CheckCircle, Banknote, MessageSquare, Users, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';

export function SuperAdminHome() {
  const [stats, setStats] = useState({
    totalSchools: 0,
    pendingSchools: 0,
    activeTickets: 0,
    totalRevenue: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [isWiping, setIsWiping] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Fetch registrations
      const regSnapshot = await getDocs(collection(db, 'registrations'));
      let total = 0;
      let pending = 0;
      regSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === 'Validé') total++;
        if (data.status === 'En attente') pending++;
      });

      // Fetch active tickets
      const ticketsQuery = query(collection(db, 'support_tickets'), where('status', '==', 'Ouvert'));
      const ticketsSnapshot = await getDocs(ticketsQuery);
      const activeTickets = ticketsSnapshot.size;

      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const activeUsers = usersSnapshot.size;

      setStats({
        totalSchools: total,
        pendingSchools: pending,
        activeTickets,
        totalRevenue: total * 15000,
        activeUsers
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleWipeData = async () => {
    if (!window.confirm("Êtes-vous ABSOLUMENT sûr ? Cette action supprimera TOUTES les données opérationnelles (professeurs, classes, cours, paiements, etc.) et ne pourra pas être annulée.")) {
      return;
    }

    try {
      setIsWiping(true);
      const collectionsToWipe = [
        'professors', 'classes', 'subjects', 'courses', 'attendances', 
        'payments', 'rooms', 'timeSlots', 'professor_requests', 'registrations'
      ];

      for (const colName of collectionsToWipe) {
        const snapshot = await getDocs(collection(db, colName));
        const batchSize = 500;
        let batch = writeBatch(db);
        let count = 0;

        for (const docSnap of snapshot.docs) {
          batch.delete(docSnap.ref);
          count++;
          if (count >= batchSize) {
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
          }
        }
        if (count > 0) await batch.commit();
      }

      // Special handling for users - keep admins and superadmins
      const usersSnapshot = await getDocs(collection(db, 'users'));
      let userBatch = writeBatch(db);
      let userCount = 0;
      for (const userDoc of usersSnapshot.docs) {
        const data = userDoc.data();
        if (data.role !== 'SuperAdmin' && data.role !== 'Admin') {
          userBatch.delete(userDoc.ref);
          userCount++;
          if (userCount >= 500) {
            await userBatch.commit();
            userBatch = writeBatch(db);
            userCount = 0;
          }
        }
      }
      if (userCount > 0) await userBatch.commit();

      // Reset settings
      await deleteDoc(doc(db, 'settings', 'global'));

      alert("Nettoyage terminé avec succès ! L'application est maintenant vide de données opérationnelles.");
      await fetchStats();
    } catch (error) {
      console.error("Error wiping data:", error);
      alert("Une erreur est survenue lors du nettoyage.");
    } finally {
      setIsWiping(false);
    }
  };

  if (loading && !isWiping) {
    return (
      <div className="p-8 flex items-center justify-center">
        <RefreshCw size={24} className="text-indigo-600 animate-spin mr-2" />
        <span className="text-gray-500">Chargement du tableau de bord...</span>
      </div>
    );
  }

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
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalSchools}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600">
              <Clock size={24} />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Inscriptions en Attente</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pendingSchools}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
              <Banknote size={24} />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Revenus (Estimés)</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalRevenue.toLocaleString()} FCFA</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
              <MessageSquare size={24} />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Tickets Support Ouverts</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeTickets}</p>
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
              <p className="text-4xl font-bold text-indigo-600">{stats.activeUsers}</p>
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


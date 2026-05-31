import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Building2, CheckCircle, XCircle, Clock, Filter, AlertTriangle } from 'lucide-react';
import { ConfirmModal } from '../../components/ConfirmModal';

type FilterTab = 'Tous' | 'En attente' | 'Validé' | 'Rejeté' | 'Paiements' | 'Paramètres';

export function SuperAdminDashboard() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('Tous');
  
  const [regToValidate, setRegToValidate] = useState<any | null>(null);
  const [regToReject, setRegToReject] = useState<any | null>(null);
  const [subToApprove, setSubToApprove] = useState<any | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [regSnap, subSnap] = await Promise.all([
        getDocs(collection(db, 'registrations')),
        getDocs(collection(db, 'subscriptions'))
      ]);
      
      const regData = regSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRegistrations(regData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      
      const subData = subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubscriptions(subData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleValidate = async () => {
    if (!regToValidate) return;
    try {
      await updateDoc(doc(db, 'registrations', regToValidate.id), { status: 'Validé' });
      await updateDoc(doc(db, 'users', regToValidate.emailEtablissement), { status: 'Actif' });
      fetchData();
      setRegToValidate(null);
    } catch (error) {
      console.error("Error validating:", error);
      alert("Erreur lors de la validation");
    }
  };

  const handleApproveSubscription = async () => {
    if (!subToApprove) return;
    try {
      await updateDoc(doc(db, 'subscriptions', subToApprove.id), { 
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
      });
      // Also update registration if it exists as a way to link
      // or update user directly
      const reg = registrations.find(r => r.schoolId === subToApprove.id);
      if (reg) {
        await updateDoc(doc(db, 'users', reg.emailEtablissement), { subscriptionStatus: 'active' });
      }
      
      fetchData();
      setSubToApprove(null);
    } catch (error) {
      console.error("Error approving subscription:", error);
      alert("Erreur lors de l'approbation");
    }
  };

  const handleReject = async () => {
    if (!regToReject) return;
    try {
      await updateDoc(doc(db, 'registrations', regToReject.id), { status: 'Rejeté' });
      await updateDoc(doc(db, 'users', regToReject.emailEtablissement), { status: 'Rejeté' });
      fetchData();
      setRegToReject(null);
    } catch (error) {
      console.error("Error rejecting:", error);
      alert("Erreur lors du rejet");
    }
  };

  const handleResetDatabase = async () => {
    const collectionsToReset = [
      'registrations', 'subscriptions', 'professors', 'classes', 
      'subjects', 'courses', 'attendances', 'payments', 'rooms', 
      'timeSlots', 'professor_requests', 'support_tickets', 'users', 'auth_mappings'
    ];
    
    try {
      setIsResetting(true);
      for (const colName of collectionsToReset) {
        const querySnapshot = await getDocs(collection(db, colName));
        const deletePromises = querySnapshot.docs.map(document => deleteDoc(doc(db, colName, document.id)));
        await Promise.all(deletePromises);
      }
      alert("Base de données réinitialisée avec succès ! Les comptes restent dans Firebase Auth mais leurs profils ont été effacés.");
      window.location.reload();
    } catch (error) {
      console.error("Erreur lors de la réinitialisation:", error);
      alert("Une erreur est survenue lors de la réinitialisation de la base de données.");
    } finally {
      setIsResetting(false);
      setShowResetConfirm(false);
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    if (activeTab === 'Tous' || activeTab === 'Paiements' || activeTab === 'Paramètres') return true;
    return reg.status === activeTab;
  });

  const pendingSubs = subscriptions.filter(sub => sub.status === 'awaiting_approval');

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Gestion de la Plateforme</h1>
        
        {/* Tabs for filtering */}
        <div className="flex items-center bg-gray-100 p-1 rounded-lg overflow-x-auto">
          {(['Tous', 'En attente', 'Validé', 'Rejeté', 'Paiements', 'Paramètres'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
            >
              {tab === 'Validé' ? 'Validés' : tab === 'Rejeté' ? 'Rejetés' : tab}
              {tab !== 'Paramètres' && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                  {tab === 'Tous' 
                    ? registrations.length 
                    : tab === 'Paiements'
                    ? pendingSubs.length
                    : registrations.filter(r => r.status === tab).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {activeTab === 'Paramètres' && (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
          <div className="bg-red-50 p-6 border-b border-red-100">
            <div className="flex items-center gap-3 text-red-800 mb-2">
              <AlertTriangle className="h-6 w-6" />
              <h2 className="text-lg font-bold">Zone Dangereuse</h2>
            </div>
            <p className="text-red-700 text-sm mb-6">
              Les actions dans cette section sont irréversibles. La suppression de la base de données effacera tous les enregistrements, établissements, élèves, et professeurs.
            </p>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              disabled={isResetting}
            >
              {isResetting ? 'Suppression en cours...' : 'Effacer toute la base de données (Danger)'}
            </button>
          </div>
        </div>
      )}

      {(activeTab === 'Tous' || activeTab === 'En attente' || activeTab === 'Validé' || activeTab === 'Rejeté') && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Établissement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Directeur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRegistrations.map((reg) => (
                <tr key={reg.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{reg.nomEtablissement}</div>
                        <div className="text-sm text-gray-500">Code: {reg.codeEtablissement} • {reg.drena}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{reg.directeurPrenom} {reg.directeurNom}</div>
                    <div className="text-sm text-gray-500">{reg.emailEtablissement}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {reg.etablissementContact1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium ${
                      reg.status === 'Validé' ? 'bg-green-100 text-green-800' :
                      reg.status === 'Rejeté' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {reg.status === 'Validé' && <CheckCircle className="w-3.5 h-3.5" />}
                      {reg.status === 'Rejeté' && <XCircle className="w-3.5 h-3.5" />}
                      {reg.status === 'En attente' && <Clock className="w-3.5 h-3.5" />}
                      {reg.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {reg.status === 'En attente' && (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setRegToValidate(reg)} className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-md transition-colors">Valider</button>
                        <button onClick={() => setRegToReject(reg)} className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md transition-colors">Rejeter</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredRegistrations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Aucune inscription trouvée pour ce filtre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Paiements' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Établissement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence Paiement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingSubs.map((sub) => {
                const reg = registrations.find(r => r.schoolId === sub.id);
                return (
                  <tr key={sub.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{reg?.nomEtablissement || sub.schoolName || 'Inconnu'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-indigo-600 bg-indigo-50/50">
                      {sub.paymentReference}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(sub.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => setSubToApprove(sub)}
                        className="text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-all shadow-sm flex items-center gap-2 ml-auto"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approuver le paiement
                      </button>
                    </td>
                  </tr>
                );
              })}
              {pendingSubs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Aucun paiement en attente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => !isResetting && setShowResetConfirm(false)}
        onConfirm={handleResetDatabase}
        title="Effacer toute la base de données"
        message="Voulez-vous vraiment TOUT effacer (établissements, professeurs, étudiants, paiements, etc.) ? Cette opération est IRREVERSIBLE et seule la liste technique des comptes de connexion (dans Auth) survivra, mais ils seront vidés de leurs données EduTime."
        confirmText={isResetting ? "Suppression encours..." : "Oui, TOUT supprimer"}
        cancelText="Annuler"
      />

      <ConfirmModal
        isOpen={!!subToApprove}
        onClose={() => setSubToApprove(null)}
        onConfirm={handleApproveSubscription}
        title="Approuver l'abonnement"
        message={`Êtes-vous sûr de vouloir approuver le paiement pour l'établissement ${subToApprove?.schoolName || ''} ? Cela activera leur accès pour 1 an.`}
        confirmText="Approuver"
        cancelText="Annuler"
      />

      <ConfirmModal
        isOpen={!!regToValidate}
        onClose={() => setRegToValidate(null)}
        onConfirm={handleValidate}
        title="Valider l'établissement"
        message={`Êtes-vous sûr de vouloir valider l'établissement ${regToValidate?.nomEtablissement} ?`}
        confirmText="Valider"
        cancelText="Annuler"
      />

      <ConfirmModal
        isOpen={!!regToReject}
        onClose={() => setRegToReject(null)}
        onConfirm={handleReject}
        title="Rejeter l'établissement"
        message={`Êtes-vous sûr de vouloir rejeter l'établissement ${regToReject?.nomEtablissement} ?`}
        confirmText="Rejeter"
        cancelText="Annuler"
        isDanger={true}
      />
    </div>
  );
}

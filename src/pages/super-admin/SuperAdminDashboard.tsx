import React, { useState } from 'react';
import { useStore } from '../../store';
import { api } from '../../api';
import { Building2, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { ConfirmModal } from '../../components/ConfirmModal';

type FilterTab = 'Tous' | 'En attente' | 'Validé' | 'Rejeté' | 'Paiements' | 'Paramètres';

export function SuperAdminDashboard() {
  const registrations = useStore(state => state.registrations);
  const subscriptions = useStore(state => state.subscriptions);
  const updateRegistration = useStore(state => state.updateRegistration);
  const updateUser = useStore(state => state.updateUser);
  const updateSubscription = useStore(state => state.updateSubscription);

  const [isResetting, setIsResetting] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('Tous');

  const [regToValidate, setRegToValidate] = useState<any | null>(null);
  const [regToReject, setRegToReject] = useState<any | null>(null);
  const [subToApprove, setSubToApprove] = useState<any | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const sortedRegistrations = [...registrations].sort((a: any, b: any) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleValidate = async () => {
    if (!regToValidate) return;
    try {
      // Appel API pour valider (active aussi le compte Admin côté serveur)
      await api.superAdmin.updateRegistration(regToValidate.id, { status: 'Validé' });
    } catch { /* fallback local */ }
    updateRegistration(regToValidate.id, { status: 'Validé' });
    updateUser(regToValidate.emailEtablissement, { status: 'Actif' });
    setRegToValidate(null);
    // Resync pour refléter les changements
    useStore.getState().syncSuperAdmin().catch(() => {});
  };

  const handleApproveSubscription = () => {
    if (!subToApprove) return;
    updateSubscription(subToApprove.id, {
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
    });
    const reg = registrations.find(r => r.schoolId === subToApprove.id);
    if (reg) {
      updateUser(reg.emailEtablissement, { subscriptionStatus: 'active' });
    }
    setSubToApprove(null);
  };

  const handleReject = async () => {
    if (!regToReject) return;
    try {
      await api.superAdmin.updateRegistration(regToReject.id, { status: 'Rejeté' });
    } catch { /* fallback local */ }
    updateRegistration(regToReject.id, { status: 'Rejeté' });
    updateUser(regToReject.emailEtablissement, { status: 'Rejeté' });
    setRegToReject(null);
    useStore.getState().syncSuperAdmin().catch(() => {});
  };

  const handleResetDatabase = () => {
    setIsResetting(true);
    useStore.setState({
      registrations: [],
      subscriptions: [],
      professors: [],
      classes: [],
      subjects: [],
      courses: [],
      attendances: [],
      payments: [],
      rooms: [],
      timeSlots: [],
      professorRequests: [],
      supportTickets: [],
      users: [],
      announcements: [],
      subscriptionPlans: [],
    });
    setIsResetting(false);
    setShowResetConfirm(false);
    alert("Données réinitialisées avec succès !");
  };

  const filteredRegistrations = sortedRegistrations.filter(reg => {
    if (activeTab === 'Tous' || activeTab === 'Paiements' || activeTab === 'Paramètres') return true;
    return reg.status === activeTab;
  });

  const pendingSubs = subscriptions.filter((sub: any) => sub.status === 'awaiting_approval');

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Gestion de la Plateforme</h1>

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
              {pendingSubs.map((sub: any) => {
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
        message="Voulez-vous vraiment TOUT effacer (établissements, professeurs, étudiants, paiements, etc.) ? Cette opération est IRREVERSIBLE."
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

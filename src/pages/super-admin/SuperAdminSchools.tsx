import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Building2, Ban, Trash2, ShieldAlert, CheckCircle, Settings as SettingsIcon } from 'lucide-react';
import { ConfirmModal } from '../../components/ConfirmModal';
import { SchoolEditModal } from './SchoolEditModal';

export function SuperAdminSchools() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [schoolToSuspend, setSchoolToSuspend] = useState<any | null>(null);
  const [schoolToDelete, setSchoolToDelete] = useState<any | null>(null);
  const [schoolToEdit, setSchoolToEdit] = useState<any | null>(null);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const regSnap = await getDocs(collection(db, 'registrations'));
      const regData = regSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // On ne prend que les établissements validés ou déjà suspendus
      const activeSchools = regData.filter((r: any) => r.status === 'Validé' || r.status === 'Suspendu');
      setSchools(activeSchools);
    } catch (error) {
      console.error("Error fetching schools:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleToggleSuspend = async () => {
    if (!schoolToSuspend) return;
    try {
      const newStatus = schoolToSuspend.status === 'Suspendu' ? 'Validé' : 'Suspendu';
      const newUserStatus = schoolToSuspend.status === 'Suspendu' ? 'Actif' : 'Suspendu';
      
      await updateDoc(doc(db, 'registrations', schoolToSuspend.id), { status: newStatus });
      await updateDoc(doc(db, 'users', schoolToSuspend.emailEtablissement), { status: newUserStatus });
      
      fetchSchools();
      setSchoolToSuspend(null);
    } catch (error) {
      console.error("Error toggling suspension:", error);
      alert("Erreur lors du changement de statut");
    }
  };

  const handleDelete = async () => {
    if (!schoolToDelete) return;
    try {
      // Pour une suppression complète, il faudrait supprimer plein de sous-collections. 
      // Ici on supprime son user et son dossier d'inscription.
      await deleteDoc(doc(db, 'users', schoolToDelete.emailEtablissement));
      await deleteDoc(doc(db, 'registrations', schoolToDelete.id));
      
      fetchSchools();
      setSchoolToDelete(null);
    } catch (error) {
      console.error("Error deleting school:", error);
      alert("Erreur lors de la suppression");
    }
  };

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Établissements</h1>
        <p className="text-gray-500 mt-1">Gérez les établissements actifs sur la plateforme (suspension, suppression)</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Établissement</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Directeur</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schools.map((school) => (
              <tr key={school.id} className={school.status === 'Suspendu' ? 'bg-red-50/50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{school.nomEtablissement}</div>
                      <div className="text-sm text-gray-500">Ville: {school.ville}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{school.directeurNom} {school.directeurPrenom}</div>
                  <div className="text-sm text-gray-500">{school.emailEtablissement}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    school.status === 'Suspendu' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {school.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setSchoolToEdit(school)}
                      className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                      title="Modifier les modules et abonnements"
                    >
                      <SettingsIcon className="w-4 h-4" />
                      Modifier
                    </button>

                    <button 
                      onClick={() => setSchoolToSuspend(school)}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
                        school.status === 'Suspendu' 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      }`}
                      title={school.status === 'Suspendu' ? "Réactiver l'établissement" : "Suspendre l'établissement"}
                    >
                      {school.status === 'Suspendu' ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      {school.status === 'Suspendu' ? 'Réactiver' : 'Suspendre'}
                    </button>
                    
                    <button 
                      onClick={() => setSchoolToDelete(school)}
                      className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                      title="Supprimer définitivement"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {schools.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  Aucun établissement actif.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={!!schoolToSuspend}
        onClose={() => setSchoolToSuspend(null)}
        onConfirm={handleToggleSuspend}
        title={schoolToSuspend?.status === 'Suspendu' ? "Réactiver l'établissement" : "Suspendre l'établissement"}
        message={schoolToSuspend?.status === 'Suspendu' 
          ? `Voulez-vous vraiment réactiver l'établissement "${schoolToSuspend.nomEtablissement}" ? Ils pourront à nouveau se connecter et accéder à EduTime.`
          : `Voulez-vous vraiment suspendre l'établissement "${schoolToSuspend?.nomEtablissement}" ? L'accès à la plateforme leur sera bloqué jusqu'à réactivation.`
        }
        confirmText={schoolToSuspend?.status === 'Suspendu' ? "Oui, réactiver" : "Oui, suspendre"}
        cancelText="Annuler"
      />

      <ConfirmModal
        isOpen={!!schoolToDelete}
        onClose={() => setSchoolToDelete(null)}
        onConfirm={handleDelete}
        title="Supprimer définitivement l'établissement"
        message={`Attention ! Vous êtes sur le point de supprimer DÉFINITIVEMENT l'établissement "${schoolToDelete?.nomEtablissement}". Le compte sera effacé et ils perdront leur accès. Continuer ?`}
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
      />

      {schoolToEdit && (
        <SchoolEditModal
          school={schoolToEdit}
          onClose={() => setSchoolToEdit(null)}
          onSave={() => {
            setSchoolToEdit(null);
            fetchSchools();
          }}
        />
      )}
    </div>
  );
}

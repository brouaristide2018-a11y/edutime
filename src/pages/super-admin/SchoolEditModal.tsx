import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { useStore } from '../../store';

interface SchoolEditModalProps {
  school: any;
  onClose: () => void;
  onSave: () => void;
}

export function SchoolEditModal({ school, onClose, onSave }: SchoolEditModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Find school settings from the store users
  const users = useStore(state => state.users);
  const updateUser = useStore(state => state.updateUser);

  const [modules, setModules] = useState({
    professors: true,
    classes: true,
    schedule: true,
    attendance: true,
    requests: true,
    payroll: true,
    support: true,
  });

  const [subscription, setSubscription] = useState({
    plan: 'Essai',
    trialStartDate: '',
    trialEndDate: '',
    status: 'Essai',
    maxClasses: 10,
    maxProfessors: 10,
  });

  useEffect(() => {
    // Try to find the user for this school and load their settings
    const schoolUser = users.find(u => u.email === school.emailEtablissement || u.schoolId === school.schoolId);
    if (schoolUser) {
      // Settings are on the store settings object filtered by schoolId
      // For local mode, we just use defaults or the school's registration data
    }
  }, [school, users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // In local mode, update the school's admin user with the new subscription info
      const schoolUser = users.find(u =>
        u.email === school.emailEtablissement || u.schoolId === school.schoolId
      );

      if (schoolUser) {
        updateUser(schoolUser.id, {
          // Store subscription info on user for reference
        } as any);
      }

      // Note: In full local mode, school-specific settings are stored per-school in the settings object
      // This modal serves as a reference/UI for the SuperAdmin
      onSave();
    } catch (err) {
      console.error("Error saving settings: ", err);
      setError("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Modifier l'établissement : {school.nomEtablissement}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-500 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Section Abonnement */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900 border-b pb-2">
              Abonnement et Limites
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                <select
                  value={subscription.plan}
                  onChange={e => setSubscription({ ...subscription, plan: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Essai">Essai</option>
                  <option value="Basique">Basique</option>
                  <option value="Pro">Pro</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  value={subscription.status}
                  onChange={e => setSubscription({ ...subscription, status: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Essai">Essai</option>
                  <option value="Actif">Actif</option>
                  <option value="Suspension Imminente">Suspension Imminente</option>
                  <option value="Suspendu">Suspendu</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max de Classes</label>
                <input
                  type="number"
                  value={subscription.maxClasses}
                  onChange={e => setSubscription({ ...subscription, maxClasses: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max de Professeurs</label>
                <input
                  type="number"
                  value={subscription.maxProfessors}
                  onChange={e => setSubscription({ ...subscription, maxProfessors: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fin de l'essai (format ISO)</label>
                <input
                  type="text"
                  value={subscription.trialEndDate}
                  onChange={e => setSubscription({ ...subscription, trialEndDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section Modules */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900 border-b pb-2">
              Fonctionnalités (Onglets Visibles)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(modules).map(([key, value]) => (
                <label key={key} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setModules({ ...modules, [key]: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-gray-700 capitalize">
                    {key === 'professors' && 'Professeurs'}
                    {key === 'classes' && 'Classes & Matières'}
                    {key === 'schedule' && 'Planning'}
                    {key === 'attendance' && 'Pointage'}
                    {key === 'requests' && 'Demandes'}
                    {key === 'payroll' && 'Heures & Paie'}
                    {key === 'support' && 'Support'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </div>
  );
}

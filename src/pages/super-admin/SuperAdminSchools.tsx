import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../../store';
import { api } from '../../api';
import {
  Building2, Ban, Trash2, CheckCircle, Settings as SettingsIcon,
  RotateCcw, AlertTriangle, Clock, Search, CheckSquare, Square,
  Loader2, X, ShieldAlert,
} from 'lucide-react';
import { SchoolEditModal } from './SchoolEditModal';

// ─── Helpers ────────────────────────────────────────────────────────────────

function daysLeft(updatedAt: string): number {
  const trashed = new Date(updatedAt).getTime();
  const diff = 30 - Math.floor((Date.now() - trashed) / 86_400_000);
  return Math.max(0, diff);
}

function DaysChip({ days }: { days: number }) {
  const color =
    days <= 3  ? 'bg-red-100 text-red-700' :
    days <= 10 ? 'bg-orange-100 text-orange-700' :
                 'bg-amber-100 text-amber-700';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
      <Clock size={11} /> {days}j restant{days > 1 ? 's' : ''}
    </span>
  );
}

// ─── Modal de confirmation de suppression définitive ────────────────────────

function DeleteConfirmModal({
  school,
  onClose,
  onConfirm,
  isLoading,
}: {
  school: any;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  const [typed, setTyped] = useState('');
  const expected = 'SUPPRIMER';
  const valid = typed === expected;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Suppression définitive</h2>
            <p className="text-xs text-red-200 mt-0.5">Action irréversible</p>
          </div>
          <button onClick={onClose} className="ml-auto text-white/70 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">
              L'établissement <strong>"{school?.nomEtablissement}"</strong> et toutes ses
              données (professeurs, classes, cours, paiements…) seront supprimés
              définitivement et ne pourront pas être récupérés.
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Tapez <span className="font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{expected}</span> pour confirmer
            </label>
            <input
              type="text"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder={expected}
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={!valid || isLoading}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Suppression...</>
                : <><Trash2 className="w-4 h-4" /> Supprimer définitivement</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal confirmation suppression multiple ─────────────────────────────────

function MultiDeleteModal({
  count,
  onClose,
  onConfirm,
  isLoading,
}: {
  count: number;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  const [typed, setTyped] = useState('');
  const expected = String(count);
  const valid = typed === expected;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Suppression multiple</h2>
            <p className="text-xs text-red-200 mt-0.5">{count} établissement{count > 1 ? 's' : ''} sélectionné{count > 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-white/70 hover:text-white"><X size={20}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">
              <strong>{count} établissement{count > 1 ? 's' : ''}</strong> et toutes leurs données associées
              seront supprimés définitivement.
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Tapez <span className="font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{expected}</span> (le nombre) pour confirmer
            </label>
            <input
              type="text"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder={expected}
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} disabled={isLoading} className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Annuler</button>
            <button
              onClick={onConfirm}
              disabled={!valid || isLoading}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
            >
              {isLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> En cours...</>
                : <><Trash2 className="w-4 h-4" /> Supprimer {count} établissement{count > 1 ? 's' : ''}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

type Tab = 'actif' | 'corbeille';

export function SuperAdminSchools() {
  const syncSuperAdmin  = useStore(s => s.syncSuperAdmin);
  const registrations   = useStore(s => s.registrations);

  const [tab, setTab]             = useState<Tab>('actif');
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [schoolToEdit, setSchoolToEdit]           = useState<any | null>(null);
  const [schoolToTrash, setSchoolToTrash]         = useState<any | null>(null);
  const [schoolToDelete, setSchoolToDelete]       = useState<any | null>(null);
  const [showMultiDelete, setShowMultiDelete]     = useState(false);
  const [schoolToSuspend, setSchoolToSuspend]     = useState<any | null>(null);

  // Séparer actifs/suspendus vs corbeille
  const activeSchools = registrations.filter(r =>
    (r.status === 'Validé' || r.status === 'Suspendu') &&
    (r.nomEtablissement?.toLowerCase().includes(search.toLowerCase()) ||
     r.directeurNom?.toLowerCase().includes(search.toLowerCase()))
  );
  const trashedSchools = registrations.filter(r =>
    r.status === 'Supprimé' &&
    (r.nomEtablissement?.toLowerCase().includes(search.toLowerCase()) ||
     r.directeurNom?.toLowerCase().includes(search.toLowerCase()))
  );

  const currentList = tab === 'actif' ? activeSchools : trashedSchools;
  const allSelected = currentList.length > 0 && currentList.every(s => selected.includes(s.id));

  const toggleSelect = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleSelectAll = () =>
    setSelected(allSelected ? [] : currentList.map(s => s.id));

  const refresh = useCallback(async () => {
    await syncSuperAdmin().catch(() => {});
    setSelected([]);
  }, [syncSuperAdmin]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleSuspend = async () => {
    if (!schoolToSuspend) return;
    setIsLoading(true);
    const newStatus = schoolToSuspend.status === 'Suspendu' ? 'Actif' : 'Suspendu';
    try {
      await api.superAdmin.updateSchoolStatus(schoolToSuspend.schoolId, newStatus);
      await refresh();
    } catch { } finally { setIsLoading(false); setSchoolToSuspend(null); }
  };

  const handleTrash = async () => {
    if (!schoolToTrash) return;
    setIsLoading(true);
    try {
      await api.superAdmin.trashSchool(schoolToTrash.schoolId);
      await refresh();
    } catch { } finally { setIsLoading(false); setSchoolToTrash(null); }
  };

  const handleRestore = async (school: any) => {
    setIsLoading(true);
    try {
      await api.superAdmin.restoreSchool(school.schoolId);
      await refresh();
    } catch { } finally { setIsLoading(false); }
  };

  const handlePermanentDelete = async () => {
    if (!schoolToDelete) return;
    setIsLoading(true);
    try {
      await api.superAdmin.deleteSchool(schoolToDelete.schoolId);
      await refresh();
    } catch { } finally { setIsLoading(false); setSchoolToDelete(null); }
  };

  const handleMultiDelete = async () => {
    setIsLoading(true);
    try {
      const toDelete = currentList.filter(s => selected.includes(s.id));
      for (const s of toDelete) {
        if (tab === 'actif') await api.superAdmin.trashSchool(s.schoolId).catch(() => {});
        else await api.superAdmin.deleteSchool(s.schoolId).catch(() => {});
      }
      await refresh();
    } finally { setIsLoading(false); setShowMultiDelete(false); }
  };

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Établissements</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Gérez les établissements actifs et la corbeille</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-56"
          />
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { key: 'actif',     label: 'Établissements actifs', count: activeSchools.length },
          { key: 'corbeille', label: 'Corbeille',              count: trashedSchools.length },
        ] as { key: Tab; label: string; count: number }[]).map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSelected([]); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              tab === t.key
                ? t.key === 'corbeille'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {t.key === 'corbeille' && <Trash2 size={14} />}
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                tab === t.key
                  ? t.key === 'corbeille' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-200 text-gray-600'
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Barre d'actions multi-sélection */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
          <span className="text-sm font-semibold text-indigo-700">
            {selected.length} sélectionné{selected.length > 1 ? 's' : ''}
          </span>
          <div className="flex-1" />
          <button
            onClick={() => setSelected([])}
            className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-white transition-colors"
          >
            Désélectionner
          </button>
          <button
            onClick={() => setShowMultiDelete(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Trash2 size={13} />
            {tab === 'actif' ? 'Déplacer dans la corbeille' : 'Supprimer définitivement'}
            &nbsp;({selected.length})
          </button>
        </div>
      )}

      {/* Corbeille — note info */}
      {tab === 'corbeille' && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            Les établissements dans la corbeille sont automatiquement et définitivement supprimés après <strong>30 jours</strong>.
            Toutes les données associées (professeurs, classes, cours, paiements) seront également supprimées.
          </p>
        </div>
      )}

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 w-10">
                <button onClick={toggleSelectAll} className="text-gray-400 hover:text-indigo-600 transition-colors">
                  {allSelected ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} />}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Établissement</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Directeur</th>
              {tab === 'corbeille' && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiration</th>
              )}
              {tab === 'actif' && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              )}
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentList.map(school => (
              <tr
                key={school.id}
                className={`transition-colors ${
                  selected.includes(school.id) ? 'bg-indigo-50/50' :
                  tab === 'corbeille' ? 'bg-red-50/30 hover:bg-red-50/50' :
                  'hover:bg-gray-50'
                }`}
              >
                <td className="px-4 py-4">
                  <button onClick={() => toggleSelect(school.id)} className="text-gray-400 hover:text-indigo-600 transition-colors">
                    {selected.includes(school.id)
                      ? <CheckSquare size={16} className="text-indigo-600" />
                      : <Square size={16} />}
                  </button>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      tab === 'corbeille' ? 'bg-red-100' : 'bg-indigo-100'
                    }`}>
                      <Building2 className={`w-5 h-5 ${tab === 'corbeille' ? 'text-red-500' : 'text-indigo-600'}`} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{school.nomEtablissement || '—'}</div>
                      <div className="text-xs text-gray-400">{school.codeEtablissement || school.emailEtablissement}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-800">{school.directeurPrenom} {school.directeurNom}</div>
                  <div className="text-xs text-gray-400">{school.emailEtablissement}</div>
                </td>
                {tab === 'corbeille' && (
                  <td className="px-4 py-4">
                    <DaysChip days={daysLeft(school.createdAt)} />
                  </td>
                )}
                {tab === 'actif' && (
                  <td className="px-4 py-4">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      school.status === 'Suspendu'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}>{school.status}</span>
                  </td>
                )}
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    {tab === 'actif' ? (
                      <>
                        <button
                          onClick={() => setSchoolToEdit(school)}
                          className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <SettingsIcon size={15} />
                        </button>
                        <button
                          onClick={() => setSchoolToSuspend(school)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            school.status === 'Suspendu'
                              ? 'bg-green-50 text-green-600 hover:bg-green-100'
                              : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                          }`}
                          title={school.status === 'Suspendu' ? 'Réactiver' : 'Suspendre'}
                        >
                          {school.status === 'Suspendu' ? <CheckCircle size={15} /> : <Ban size={15} />}
                        </button>
                        <button
                          onClick={() => setSchoolToTrash(school)}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Déplacer dans la corbeille"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRestore(school)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-medium transition-colors"
                          title="Restaurer"
                        >
                          <RotateCcw size={13} /> Restaurer
                        </button>
                        <button
                          onClick={() => setSchoolToDelete(school)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-medium transition-colors"
                          title="Supprimer définitivement"
                        >
                          <Trash2 size={13} /> Supprimer
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {currentList.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  {tab === 'corbeille' ? (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Trash2 size={36} className="opacity-30" />
                      <p className="text-sm">La corbeille est vide</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Aucun établissement actif</p>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}

      {/* Suspendre / Réactiver */}
      {schoolToSuspend && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              {schoolToSuspend.status === 'Suspendu' ? 'Réactiver' : 'Suspendre'} l'établissement
            </h3>
            <p className="text-sm text-gray-600">
              {schoolToSuspend.status === 'Suspendu'
                ? `Réactiver "${schoolToSuspend.nomEtablissement}" permettra à cet établissement de se reconnecter.`
                : `Suspendre "${schoolToSuspend.nomEtablissement}" bloquera l'accès à la plateforme.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setSchoolToSuspend(null)} className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200">Annuler</button>
              <button onClick={handleSuspend} disabled={isLoading} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Déplacer dans la corbeille */}
      {schoolToTrash && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Déplacer dans la corbeille</h3>
            </div>
            <p className="text-sm text-gray-600">
              <strong>"{schoolToTrash.nomEtablissement}"</strong> sera déplacé dans la corbeille
              et supprimé définitivement après <strong>30 jours</strong>.
              Vous pourrez le restaurer avant cette échéance.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setSchoolToTrash(null)} className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200">Annuler</button>
              <button onClick={handleTrash} disabled={isLoading} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 size={14} />}
                Déplacer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suppression définitive individuelle */}
      {schoolToDelete && (
        <DeleteConfirmModal
          school={schoolToDelete}
          onClose={() => setSchoolToDelete(null)}
          onConfirm={handlePermanentDelete}
          isLoading={isLoading}
        />
      )}

      {/* Suppression multiple */}
      {showMultiDelete && (
        <MultiDeleteModal
          count={selected.length}
          onClose={() => setShowMultiDelete(false)}
          onConfirm={handleMultiDelete}
          isLoading={isLoading}
        />
      )}

      {/* Modifier */}
      {schoolToEdit && (
        <SchoolEditModal
          school={schoolToEdit}
          onClose={() => setSchoolToEdit(null)}
          onSave={async () => { setSchoolToEdit(null); await refresh(); }}
        />
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { RefreshCw, Printer, Edit, User, CalendarDays, ArrowLeft, Edit2, AlertTriangle, Search, GraduationCap } from 'lucide-react';
import { WeeklySchedule } from '../components/WeeklySchedule';
import { ProfessorTimetableDocument } from '../components/ProfessorTimetableDocument';
import { ProfessorDetail } from './ProfessorDetail';

export function Timetable() {
  const navigate = useNavigate();
  const professors = useStore(state => state.professors);
  const clearAssignments = useStore(state => state.clearAssignments);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfId, setSelectedProfId] = useState<string | null>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProfs, setSelectedProfs] = useState<string[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filteredProfessors = professors.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    setSelectedProfs(checked ? filteredProfessors.map(p => p.id) : []);
  };

  const handleSelectProf = (id: string) => {
    setSelectedProfs(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleClearAssignments = async () => {
    await clearAssignments();
    setShowClearConfirm(false);
  };

  /* ── Vue emploi du temps d'un prof ── */
  if (viewingProfileId) {
    return (
      <div className="h-full overflow-auto">
        <ProfessorDetail professorId={viewingProfileId} onBack={() => setViewingProfileId(null)} />
      </div>
    );
  }

  if (selectedProfId) {
    const prof = professors.find(p => p.id === selectedProfId);
    return (
      <div className="space-y-4 h-full flex flex-col">
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedProfId(null); setIsEditing(false); }}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {prof?.firstName} {prof?.lastName}
              </h2>
              <p className="text-sm text-gray-500">Emploi du temps</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => {
                  const printContent = document.getElementById('printable-timetable');
                  if (printContent) {
                    const originalContents = document.body.innerHTML;
                    document.body.innerHTML = printContent.outerHTML;
                    window.print();
                    document.body.innerHTML = originalContents;
                    window.location.reload();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Printer className="w-4 h-4" />
                Imprimer
              </button>
            )}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors text-sm font-semibold ${
                isEditing
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              <Edit2 className="w-4 h-4" />
              {isEditing ? 'Édition active' : 'Modifier'}
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 overflow-auto">
          {isEditing ? (
            <WeeklySchedule type="prof" id={selectedProfId} readOnly={false} />
          ) : (
            <ProfessorTimetableDocument professorId={selectedProfId} />
          )}
        </div>
      </div>
    );
  }

  /* ── Liste des professeurs ── */
  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emploi du temps Professeur</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filteredProfessors.length} professeur(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Vider les attributions
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher un professeur ou une spécialité..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        />
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Sélection globale */}
        {filteredProfessors.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
              <input
                type="checkbox"
                onChange={(e) => handleSelectAll(e.target.checked)}
                checked={selectedProfs.length === filteredProfessors.length && filteredProfessors.length > 0}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Tout sélectionner
            </label>
            {selectedProfs.length > 0 && (
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                {selectedProfs.length} sélectionné(s)
              </span>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider w-12">N°</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Nom & Prénoms</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Matricule</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Spécialité</th>
                <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProfessors.map((professor, index) => (
                <tr
                  key={professor.id}
                  className="hover:bg-indigo-50/40 transition-colors group"
                >
                  <td className="px-5 py-3.5 text-sm text-gray-500 font-medium">{index + 1}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedProfs.includes(professor.id)}
                        onChange={() => handleSelectProf(professor.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0"
                      />
                      {professor.photoUrl ? (
                        <img
                          src={professor.photoUrl}
                          alt={`${professor.firstName} ${professor.lastName}`}
                          className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0">
                          {professor.firstName?.[0]}{professor.lastName?.[0]}
                        </div>
                      )}
                      <span className="text-sm font-semibold text-gray-900">
                        {professor.lastName} {professor.firstName}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded-lg">
                      E{professor.id.substring(0, 8).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-gray-600 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                      {professor.specialty}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => navigate('/professors', { state: { editProfId: professor.id } })}
                        className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200"
                        title="Modifier"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setViewingProfileId(professor.id)}
                        className="p-1.5 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition-colors border border-sky-200"
                        title="Voir le profil"
                      >
                        <User className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedProfId(professor.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs font-semibold shadow-sm"
                      >
                        <CalendarDays className="w-3.5 h-3.5" />
                        Emploi du temps
                      </button>
                      <button
                        onClick={() => alert(`Impression de l'emploi du temps de ${professor.firstName} ${professor.lastName}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Imprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProfessors.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">Aucun professeur trouvé.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modale confirmation vider attributions */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Vider les attributions</h2>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer toutes les attributions de classes aux professeurs ?
              Cette action est <strong>irréversible</strong>.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleClearAssignments}
                className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors font-semibold"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

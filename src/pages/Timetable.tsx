import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { RefreshCw, Printer, Edit, User, CalendarDays, ArrowLeft, Edit2, AlertTriangle } from 'lucide-react';
import { WeeklySchedule } from '../components/WeeklySchedule';
import { ProfessorTimetableDocument } from '../components/ProfessorTimetableDocument';
import { ProfessorDetail } from './ProfessorDetail';

export function Timetable() {
  const navigate = useNavigate();
  const professors = useStore(state => state.professors);
  const clearAssignments = useStore(state => state.clearAssignments);
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(300);
  const [selectedProfId, setSelectedProfId] = useState<string | null>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProfs, setSelectedProfs] = useState<string[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filteredProfessors = professors.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProfs(filteredProfessors.map(p => p.id));
    } else {
      setSelectedProfs([]);
    }
  };

  const handleSelectProf = (id: string) => {
    setSelectedProfs(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleClearAssignments = async () => {
    await clearAssignments();
    setShowClearConfirm(false);
    alert('Les attributions ont été vidées avec succès.');
  };

  const renderPrintButtons = () => {
    const numProfs = filteredProfessors.length;
    if (numProfs === 0) return null;
    
    const buttons = [];
    for (let i = 0; i < numProfs; i += 11) {
      const start = i + 1;
      const end = Math.min(i + 11, numProfs);
      buttons.push(
        <button key={start} onClick={() => alert(`Impression des emplois du temps de ${start} à ${end}`)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm font-medium border border-gray-300">
          <Printer className="w-4 h-4" />
          {start} -&gt; {end}
        </button>
      );
    }
    return buttons;
  };

  if (viewingProfileId) {
    return (
      <div className="h-full overflow-auto">
        <ProfessorDetail 
          professorId={viewingProfileId} 
          onBack={() => setViewingProfileId(null)} 
        />
      </div>
    );
  }

  if (selectedProfId) {
    const prof = professors.find(p => p.id === selectedProfId);
    return (
      <div className="space-y-4 h-full flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setSelectedProfId(null);
                setIsEditing(false);
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-xl font-bold text-gray-900">
              Emploi du temps : {prof?.firstName} {prof?.lastName}
            </h2>
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
                    window.location.reload(); // Reload to restore React state
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Imprimer
              </button>
            )}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isEditing 
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              <Edit2 className="w-4 h-4" />
              {isEditing ? 'Mode édition actif' : 'Modifier'}
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-gray-200 p-4 overflow-auto">
          {isEditing ? (
            <WeeklySchedule type="prof" id={selectedProfId} readOnly={false} />
          ) : (
            <ProfessorTimetableDocument professorId={selectedProfId} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-end gap-2">
        <button 
          onClick={() => alert('Les attributions ont été actualisées avec succès.')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Actualisation des Attributions
        </button>
        
        <div className="flex flex-col items-end gap-1">
          <span className="text-red-600 font-bold text-sm">Impression par lot</span>
          <div className="flex gap-2 flex-wrap justify-end">
            {renderPrintButtons()}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-2">
          <select 
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
          >
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={300}>300</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Recherche:</label>
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-500 text-white">
                <th className="px-4 py-3 text-sm font-bold uppercase w-16">N°</th>
                <th className="px-4 py-3 text-sm font-bold uppercase">NOM & PRÉNOMS</th>
                <th className="px-4 py-3 text-sm font-bold uppercase">MATRICULE</th>
                <th className="px-4 py-3 text-sm font-bold uppercase">SPÉCIALITÉ</th>
                <th className="px-4 py-3 text-sm font-bold uppercase text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span>ACTIONS</span>
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={selectedProfs.length === filteredProfessors.length && filteredProfessors.length > 0}
                      className="rounded-sm border-gray-300 text-indigo-600 focus:ring-indigo-500 bg-white" 
                    />
                    <button 
                      onClick={() => setShowClearConfirm(true)}
                      className="flex items-center gap-1 px-2 py-1 bg-indigo-500 text-white rounded text-xs hover:bg-indigo-600 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      vider les attributions
                    </button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProfessors.map((professor, index) => (
                <tr key={professor.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                  <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      {professor.photoUrl ? (
                        <img src={professor.photoUrl} alt={`${professor.firstName} ${professor.lastName}`} className="w-6 h-6 rounded-full object-cover border border-gray-200" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium text-xs">
                          {(professor.firstName?.[0] || '')}{(professor.lastName?.[0] || '')}
                        </div>
                      )}
                      <span>{professor.lastName} {professor.firstName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">E{professor.id.substring(0, 8).toUpperCase()}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{professor.specialty}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => navigate('/professors', { state: { editProfId: professor.id } })}
                        className="p-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors" 
                        title="Éditer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setViewingProfileId(professor.id)}
                        className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors" 
                        title="Profil"
                      >
                        <User className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setSelectedProfId(professor.id)}
                        className="flex items-center gap-1 px-2 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-xs font-medium shadow-sm"
                        title="Voir emploi du temps"
                      >
                        <CalendarDays className="w-3.5 h-3.5" />
                        Voir emploi du temps
                      </button>
                      <button 
                        onClick={() => alert(`Impression de l'emploi du temps de ${professor.firstName} ${professor.lastName}`)}
                        className="flex items-center gap-1 px-2 py-1.5 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-xs font-medium shadow-sm"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Imprimer 1
                      </button>
                      <input 
                        type="checkbox" 
                        checked={selectedProfs.includes(professor.id)}
                        onChange={() => handleSelectProf(professor.id)}
                        className="ml-2 rounded-sm border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4" 
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProfessors.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Aucun professeur trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle className="w-8 h-8" />
              <h2 className="text-xl font-bold">Vider les attributions</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir vider toutes les attributions de classes aux professeurs ? 
              Cette action est irréversible et aucun professeur ne sera plus associé à une classe.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleClearAssignments}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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

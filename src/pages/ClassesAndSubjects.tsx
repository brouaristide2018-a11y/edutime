import React, { useState } from 'react';
import { useStore, Class, Subject, ClassLevel, ClassStatus, ClassSubjectProfessor, TimeSlot } from '../store';
import { Plus, Trash2, X, Edit2, Users, BookOpen, Search, Filter, Clock } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

const PREDEFINED_SUBJECTS = [
  'Français',
  'Anglais',
  'Espagnol',
  'Allemand',
  'Mathématiques',
  'Physique Chimie',
  'SVT',
  'Informatique',
  'Histoire',
  'Géographie',
  'EDHC',
  'Philosophie',
  'Économie',
  'Comptabilité',
  'Gestion',
  'Éducation musicale',
  'Arts plastiques',
  'EPS'
];

const generateSubjectCode = (name: string) => {
  const customMap: Record<string, string> = {
    'Français': 'FR',
    'Anglais': 'ANG',
    'Espagnol': 'ESP',
    'Allemand': 'ALL',
    'Mathématiques': 'MATH',
    'Physique Chimie': 'PC',
    'SVT': 'SVT',
    'Informatique': 'INFO',
    'Histoire': 'HIST',
    'Géographie': 'GEO',
    'EDHC': 'EDHC',
    'Philosophie': 'PHILO',
    'Économie': 'ECO',
    'Comptabilité': 'COMPTA',
    'Gestion': 'GEST',
    'Éducation musicale': 'MUS',
    'Arts plastiques': 'ART',
    'EPS': 'EPS'
  };
  
  if (customMap[name]) {
    return customMap[name];
  }
  
  return name.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
};

export function ClassesAndSubjects() {
  const { classes, subjects, professors, classSubjectProfessors, timeSlots, addClass, updateClass, deleteClass, addSubject, updateSubject, deleteSubject, assignProfessorToClassSubject, removeAssignment, addTimeSlot, updateTimeSlot, deleteTimeSlot, settings } = useStore();
  const [activeTab, setActiveTab] = useState<'classes' | 'subjects' | 'assignments' | 'timeSlots'>('classes');
  
  // Class Modal State
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [classForm, setClassForm] = useState<Partial<Class>>({
    name: '',
    level: 'Collège',
    description: '',
    capacity: 30,
    mainTeacherId: '',
    status: 'Actif'
  });

  // Subject Modal State
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [subjectForm, setSubjectForm] = useState<Partial<Subject>>({
    name: '',
    code: '',
    description: '',
    weeklyHours: 2,
    color: '#3b82f6'
  });

  // Assignment Modal State
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState<Partial<ClassSubjectProfessor>>({
    classId: '',
    subjectId: '',
    professorId: ''
  });

  // Class Detail Modal State
  const [viewingClassId, setViewingClassId] = useState<string | null>(null);

  // Search and Filter
  const [searchTerm, setSearchTerm] = useState('');

  // Delete Modals State
  const [classToDelete, setClassToDelete] = useState<string | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);
  const [timeSlotToDelete, setTimeSlotToDelete] = useState<string | null>(null);

  // Handlers for Classes
  const openClassModal = (cls?: Class) => {
    if (cls) {
      setEditingClassId(cls.id);
      setClassForm(cls);
    } else {
      setEditingClassId(null);
      setClassForm({
        name: '',
        level: 'Collège',
        description: '',
        capacity: 30,
        mainTeacherId: '',
        status: 'Actif'
      });
    }
    setIsClassModalOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingClassId) {
      // Check subscription limits
      const maxClasses = settings.subscription?.maxClasses || 10;
      if (classes.length >= maxClasses) {
        alert(`Limite atteinte ! Vous avez atteint le nombre maximum de classes (${maxClasses}) pour votre plan actuel (${settings.subscription?.plan}). Veuillez passer à un plan supérieur pour en ajouter de nouvelles.`);
        return;
      }
    }

    if (editingClassId) {
      updateClass(editingClassId, classForm);
    } else {
      addClass({
        ...classForm as Omit<Class, 'id'>,
        createdAt: new Date().toISOString()
      });
    }
    setIsClassModalOpen(false);
  };

  // Handlers for Subjects
  const openSubjectModal = (sub?: Subject) => {
    if (sub) {
      setEditingSubjectId(sub.id);
      setSubjectForm(sub);
      const isCustom = sub.name && !PREDEFINED_SUBJECTS.includes(sub.name);
      setIsCustomSubject(!!isCustom);
    } else {
      setEditingSubjectId(null);
      setIsCustomSubject(false);
      setSubjectForm({
        name: '',
        code: '',
        description: '',
        weeklyHours: 2,
        color: '#3b82f6'
      });
    }
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubjectId) {
      updateSubject(editingSubjectId, subjectForm);
    } else {
      addSubject({
        ...subjectForm as Omit<Subject, 'id'>,
        createdAt: new Date().toISOString()
      });
    }
    setIsSubjectModalOpen(false);
  };

  // Handlers for Assignments
  const openAssignmentModal = () => {
    setAssignmentForm({
      classId: '',
      subjectId: '',
      professorId: ''
    });
    setIsAssignmentModalOpen(true);
  };

  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    assignProfessorToClassSubject(assignmentForm as Omit<ClassSubjectProfessor, 'id'>);
    setIsAssignmentModalOpen(false);
  };

  // TimeSlot Modal State
  const [isTimeSlotModalOpen, setIsTimeSlotModalOpen] = useState(false);
  const [editingTimeSlotId, setEditingTimeSlotId] = useState<string | null>(null);
  const [timeSlotForm, setTimeSlotForm] = useState<Partial<TimeSlot>>({
    startTime: '',
    endTime: '',
    type: 'Cours'
  });

  // Handlers for TimeSlots
  const openTimeSlotModal = (slot?: TimeSlot) => {
    if (slot) {
      setEditingTimeSlotId(slot.id);
      setTimeSlotForm(slot);
    } else {
      setEditingTimeSlotId(null);
      setTimeSlotForm({
        startTime: '',
        endTime: '',
        type: 'Cours'
      });
    }
    setIsTimeSlotModalOpen(true);
  };

  const handleSaveTimeSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTimeSlotId) {
      updateTimeSlot(editingTimeSlotId, timeSlotForm);
    } else {
      addTimeSlot(timeSlotForm as Omit<TimeSlot, 'id'>);
    }
    setIsTimeSlotModalOpen(false);
  };

  const filteredClasses = classes.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredSubjects = subjects.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.code.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Structure Pédagogique</h1>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('classes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'classes' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            Classes
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'subjects' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Matières
          </button>
          <button
            onClick={() => setActiveTab('timeSlots')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'timeSlots' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            Heures de Cours
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'assignments' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            Affectations
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={activeTab === 'classes' ? "Rechercher une classe..." : activeTab === 'subjects' ? "Rechercher une matière..." : activeTab === 'timeSlots' ? "Rechercher un horaire..." : "Rechercher..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <button
          onClick={() => {
            if (activeTab === 'classes') openClassModal();
            else if (activeTab === 'subjects') openSubjectModal();
            else if (activeTab === 'timeSlots') openTimeSlotModal();
            else openAssignmentModal();
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {activeTab === 'classes' ? 'Ajouter une classe' : activeTab === 'subjects' ? 'Ajouter une matière' : activeTab === 'timeSlots' ? 'Ajouter un horaire' : 'Nouvelle affectation'}
        </button>
      </div>

      {/* Classes Tab */}
      {activeTab === 'classes' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">Nom</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">Niveau</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">Effectif</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">Prof. Principal</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">Statut</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClasses.map((cls) => {
                  const mainTeacher = professors.find(p => p.id === cls.mainTeacherId);
                  return (
                    <tr key={cls.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{cls.name}</span>
                        {cls.description && <p className="text-xs text-gray-500 mt-1">{cls.description}</p>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{cls.level || 'Non défini'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{cls.capacity || 0} élèves</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {mainTeacher ? `${mainTeacher.firstName} ${mainTeacher.lastName}` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          cls.status === 'Actif' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {cls.status || 'Actif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setViewingClassId(cls.id)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors" title="Voir les détails">
                            <BookOpen className="w-4 h-4" />
                          </button>
                          <button onClick={() => openClassModal(cls)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors" title="Modifier">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setClassToDelete(cls.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors" title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredClasses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Aucune classe trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subjects Tab */}
      {activeTab === 'subjects' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">Matière</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">Code</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">Volume Horaire</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSubjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: sub.color || '#3b82f6' }} />
                        <div>
                          <span className="font-medium text-gray-900">{sub.name}</span>
                          {sub.description && <p className="text-xs text-gray-500 mt-1">{sub.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{sub.code || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{sub.weeklyHours || 0}h / sem</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openSubjectModal(sub)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setSubjectToDelete(sub.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSubjects.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Aucune matière trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">Classe</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">Matière</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">Professeur</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {classSubjectProfessors.map((assignment) => {
                  const cls = classes.find(c => c.id === assignment.classId);
                  const sub = subjects.find(s => s.id === assignment.subjectId);
                  const prof = professors.find(p => p.id === assignment.professorId);
                  
                  // Filter by search term
                  const searchStr = `${cls?.name} ${sub?.name} ${prof?.firstName} ${prof?.lastName}`.toLowerCase();
                  if (searchTerm && !searchStr.includes(searchTerm.toLowerCase())) return null;

                  return (
                    <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{cls?.name || 'Classe introuvable'}</td>
                      <td className="px-6 py-4 text-gray-600">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sub?.color || '#ccc' }} />
                          {sub?.name || 'Matière introuvable'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {prof ? `${prof.firstName} ${prof.lastName}` : 'Professeur introuvable'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => setAssignmentToDelete(assignment.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {classSubjectProfessors.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Aucune affectation trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TimeSlots Tab */}
      {activeTab === 'timeSlots' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">Nº</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">Heure de début</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">Heure de fin</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">Type Plage</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {timeSlots.map((slot, index) => (
                  <tr key={slot.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 text-gray-600">{slot.startTime}</td>
                    <td className="px-6 py-4 text-gray-600">{slot.endTime}</td>
                    <td className="px-6 py-4 text-gray-600">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        slot.type === 'Cours' ? 'bg-blue-100 text-blue-800' :
                        slot.type === 'Recréation' ? 'bg-green-100 text-green-800' :
                        slot.type === 'Après-Midi' ? 'bg-orange-100 text-orange-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {slot.type || 'Cours'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openTimeSlotModal(slot)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setTimeSlotToDelete(slot.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {timeSlots.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Aucun horaire défini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Class Modal */}
      {isClassModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingClassId ? 'Modifier la classe' : 'Nouvelle classe'}
              </h2>
              <button onClick={() => setIsClassModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la classe *</label>
                <input
                  type="text"
                  required
                  value={classForm.name || ''}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  placeholder="Ex: 6ème A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Niveau *</label>
                  <select
                    required
                    value={classForm.level || 'Collège'}
                    onChange={(e) => setClassForm({ ...classForm, level: e.target.value as ClassLevel })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value="Primaire">Primaire</option>
                    <option value="Collège">Collège</option>
                    <option value="Lycée">Lycée</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Effectif</label>
                  <input
                    type="number"
                    min="1"
                    value={classForm.capacity || ''}
                    onChange={(e) => setClassForm({ ...classForm, capacity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Professeur principal</label>
                <select
                  value={classForm.mainTeacherId || ''}
                  onChange={(e) => setClassForm({ ...classForm, mainTeacherId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="">Aucun</option>
                  {professors.map(p => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  value={classForm.status || 'Actif'}
                  onChange={(e) => setClassForm({ ...classForm, status: e.target.value as ClassStatus })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={classForm.description || ''}
                  onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Détails supplémentaires..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingClassId ? 'Mettre à jour' : 'Créer la classe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingSubjectId ? 'Modifier la matière' : 'Nouvelle matière'}
              </h2>
              <button onClick={() => setIsSubjectModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la matière *</label>
                <select
                  required={!isCustomSubject}
                  value={isCustomSubject ? 'Autres' : (subjectForm.name || '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'Autres') {
                      setIsCustomSubject(true);
                      setSubjectForm({ ...subjectForm, name: '', code: '' });
                    } else {
                      setIsCustomSubject(false);
                      setSubjectForm({ ...subjectForm, name: val, code: generateSubjectCode(val) });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="">Sélectionner une matière...</option>
                  {PREDEFINED_SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                  <option value="Autres">Autres</option>
                </select>
                
                {isCustomSubject && (
                  <input
                    type="text"
                    required
                    value={subjectForm.name || ''}
                    onChange={(e) => setSubjectForm({ 
                      ...subjectForm, 
                      name: e.target.value,
                      code: generateSubjectCode(e.target.value)
                    })}
                    placeholder="Saisissez la matière"
                    className="w-full px-3 py-2 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    value={subjectForm.code || ''}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                    placeholder="Ex: MATH"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Volume horaire (h/sem)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={subjectForm.weeklyHours || ''}
                    onChange={(e) => setSubjectForm({ ...subjectForm, weeklyHours: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Couleur (Planning)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={subjectForm.color || '#3b82f6'}
                    onChange={(e) => setSubjectForm({ ...subjectForm, color: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                  />
                  <input
                    type="text"
                    value={subjectForm.color || '#3b82f6'}
                    onChange={(e) => setSubjectForm({ ...subjectForm, color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={subjectForm.description || ''}
                  onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Détails sur le programme..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingSubjectId ? 'Mettre à jour' : 'Créer la matière'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Class Detail Modal */}
      {viewingClassId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            {(() => {
              const cls = classes.find(c => c.id === viewingClassId);
              if (!cls) return null;
              
              const mainTeacher = professors.find(p => p.id === cls.mainTeacherId);
              const classAssignments = classSubjectProfessors.filter(a => a.classId === cls.id);
              
              return (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{cls.name}</h2>
                      <p className="text-gray-500">{cls.level} • {cls.capacity || 0} élèves</p>
                    </div>
                    <button onClick={() => setViewingClassId(null)} className="text-gray-500 hover:text-gray-700">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Informations Générales</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 block">Professeur principal</span>
                          <span className="font-medium text-gray-900">{mainTeacher ? `${mainTeacher.firstName} ${mainTeacher.lastName}` : 'Non assigné'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Statut</span>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                            cls.status === 'Actif' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {cls.status || 'Actif'}
                          </span>
                        </div>
                        {cls.description && (
                          <div className="col-span-2">
                            <span className="text-gray-500 block">Description</span>
                            <span className="text-gray-900">{cls.description}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Équipe Pédagogique & Matières</h3>
                      {classAssignments.length === 0 ? (
                        <p className="text-gray-500 text-sm italic">Aucune matière n'est encore assignée à cette classe.</p>
                      ) : (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="px-4 py-3 font-semibold text-gray-900">Matière</th>
                                <th className="px-4 py-3 font-semibold text-gray-900">Professeur</th>
                                <th className="px-4 py-3 font-semibold text-gray-900">Volume</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {classAssignments.map(assignment => {
                                const sub = subjects.find(s => s.id === assignment.subjectId);
                                const prof = professors.find(p => p.id === assignment.professorId);
                                return (
                                  <tr key={assignment.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sub?.color || '#ccc' }} />
                                        <span className="font-medium text-gray-900">{sub?.name || 'Inconnue'}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                      {prof ? `${prof.firstName} ${prof.lastName}` : 'Inconnu'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                      {sub?.weeklyHours || 0}h / sem
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot className="bg-gray-50 border-t border-gray-200">
                              <tr>
                                <td colSpan={2} className="px-4 py-3 font-semibold text-gray-900 text-right">Total des heures :</td>
                                <td className="px-4 py-3 font-bold text-indigo-600">
                                  {classAssignments.reduce((total, assignment) => {
                                    const sub = subjects.find(s => s.id === assignment.subjectId);
                                    return total + (sub?.weeklyHours || 0);
                                  }, 0)}h / sem
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {isAssignmentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Nouvelle affectation</h2>
              <button onClick={() => setIsAssignmentModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Classe *</label>
                <select
                  required
                  value={assignmentForm.classId || ''}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, classId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matière *</label>
                <select
                  required
                  value={assignmentForm.subjectId || ''}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, subjectId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="">Sélectionner une matière</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Professeur *</label>
                <select
                  required
                  value={assignmentForm.professorId || ''}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, professorId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="">Sélectionner un professeur</option>
                  {professors.map(p => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>
              
              {/* Validation Check */}
              {assignmentForm.classId && assignmentForm.subjectId && assignmentForm.professorId && (
                <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
                  {classSubjectProfessors.some(a => a.classId === assignmentForm.classId && a.subjectId === assignmentForm.subjectId) ? (
                    <span className="text-amber-600 font-medium">⚠️ Attention : Cette classe a déjà un professeur pour cette matière.</span>
                  ) : (
                    <span>✅ Cette affectation est valide.</span>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAssignmentModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  disabled={!assignmentForm.classId || !assignmentForm.subjectId || !assignmentForm.professorId}
                >
                  Affecter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* TimeSlot Modal */}
      {isTimeSlotModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTimeSlotId ? 'Modifier l\'horaire' : 'Nouvel horaire'}
              </h2>
              <button onClick={() => setIsTimeSlotModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveTimeSlot} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type plage horaire *</label>
                <select
                  required
                  value={timeSlotForm.type || 'Cours'}
                  onChange={(e) => setTimeSlotForm({ ...timeSlotForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="Cours">Cours</option>
                  <option value="Recréation">Recréation</option>
                  <option value="Après-Midi">Après-Midi</option>
                  <option value="Devoir">Devoir</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure de début *</label>
                  <input
                    type="time"
                    required
                    value={timeSlotForm.startTime || ''}
                    onChange={(e) => setTimeSlotForm({ ...timeSlotForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure de fin *</label>
                  <input
                    type="time"
                    required
                    value={timeSlotForm.endTime || ''}
                    onChange={(e) => setTimeSlotForm({ ...timeSlotForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsTimeSlotModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingTimeSlotId ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!classToDelete}
        onClose={() => setClassToDelete(null)}
        onConfirm={() => {
          if (classToDelete) {
            deleteClass(classToDelete);
            setClassToDelete(null);
          }
        }}
        title="Supprimer la classe"
        message="Êtes-vous sûr de vouloir supprimer cette classe ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
      />

      <ConfirmModal
        isOpen={!!subjectToDelete}
        onClose={() => setSubjectToDelete(null)}
        onConfirm={() => {
          if (subjectToDelete) {
            deleteSubject(subjectToDelete);
            setSubjectToDelete(null);
          }
        }}
        title="Supprimer la matière"
        message="Êtes-vous sûr de vouloir supprimer cette matière ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
      />

      <ConfirmModal
        isOpen={!!assignmentToDelete}
        onClose={() => setAssignmentToDelete(null)}
        onConfirm={() => {
          if (assignmentToDelete) {
            removeAssignment(assignmentToDelete);
            setAssignmentToDelete(null);
          }
        }}
        title="Supprimer l'affectation"
        message="Êtes-vous sûr de vouloir supprimer cette affectation ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
      />

      <ConfirmModal
        isOpen={!!timeSlotToDelete}
        onClose={() => setTimeSlotToDelete(null)}
        onConfirm={() => {
          if (timeSlotToDelete) {
            deleteTimeSlot(timeSlotToDelete);
            setTimeSlotToDelete(null);
          }
        }}
        title="Supprimer l'horaire"
        message="Êtes-vous sûr de vouloir supprimer cet horaire ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
      />
    </div>
  );
}

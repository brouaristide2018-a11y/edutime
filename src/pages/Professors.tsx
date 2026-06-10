import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore, type Professor, type ContractType, type ProfessorStatus, type Gender } from '../store';
import { api } from '../api';
import { Plus, Edit2, Trash2, X, Search, Filter, Eye, Camera, CheckCircle2 } from 'lucide-react';
import { parseISO } from 'date-fns';
import { useToast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';
import { ProfessorDetail } from './ProfessorDetail';
import { compressImage } from '../utils/image';

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

export function Professors() {
  const navigate = useNavigate();
  const location = useLocation();
  const { professors, courses, addProfessor, updateProfessor, deleteProfessor, settings, addUser, deleteUser, updateUser, users } = useStore();
  const currentUser = useStore(state => state.currentUser);
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmAddOpen, setIsConfirmAddOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<typeof formData | null>(null);
  const [isAddingProf, setIsAddingProf] = useState(false);
  const [viewingProfId, setViewingProfId] = useState<string | null>(null);
  const [isCustomSpecialty, setIsCustomSpecialty] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [profToDelete, setProfToDelete] = useState<Professor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<Omit<Professor, 'id' | 'availabilities' | 'subjectIds'>>({
    firstName: '',
    lastName: '',
    gender: 'M',
    birthDate: '',
    phone: '',
    email: '',
    address: '',
    specialty: '',
    contractType: 'Temps plein',
    hourlyRate: 0,
    status: 'Actif',
    hireDate: new Date().toISOString().split('T')[0],
    photoUrl: undefined,
  });

  useEffect(() => {
    const state = location.state as { editProfId?: string } | null;
    if (state?.editProfId) {
      const prof = professors.find(p => p.id === state.editProfId);
      if (prof) {
        // Use setTimeout to ensure the modal opens after any navigation state updates
        setTimeout(() => {
          openEdit(prof);
        }, 0);
      }
      // Clear the state so it doesn't reopen on refresh or subsequent visits
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, professors, navigate]);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const calculateHours = (profId: string) => {
    const profCourses = courses.filter(c => {
      if (c.professorId !== profId || !c.date) return false;
      try {
        const d = parseISO(c.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      } catch (e) {
        return false;
      }
    });
    
    return profCourses.reduce((acc, course) => {
      const start = new Date(`2000-01-01T${course.startTime}`);
      const end = new Date(`2000-01-01T${course.endTime}`);
      return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);
  };

  const filteredProfessors = useMemo(() => {
    return professors.filter(prof => {
      const firstName = prof.firstName || '';
      const lastName = prof.lastName || '';
      const specialty = prof.specialty || '';
      
      const matchesSearch = 
        firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        specialty.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [professors, searchTerm]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("L'image est trop grande. Veuillez choisir une image de moins de 2Mo.");
        return;
      }
      try {
        const compressedDataUrl = await compressImage(file, 256, 256);
        setFormData({ ...formData, photoUrl: compressedDataUrl });
      } catch (error) {
        console.error('Error compressing image:', error);
        alert("Une erreur s'est produite lors de la compression de l'image.");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingId) {
      // Check limits before adding a new professor
      const maxProfessors = settings.subscription?.maxProfessors || 10;
      if (professors.length >= maxProfessors) {
        showToast(`Limite atteinte ! Maximum ${maxProfessors} professeurs pour le plan ${settings.subscription?.plan}.`, 'error');
        return;
      }
    }

    if (editingId) {
      const prof = professors.find(p => p.id === editingId);
      
      if (prof && prof.userId && prof.email !== formData.email) {
        // Email changed, we need to create a new user and delete the old one
        const oldUserId = prof.userId;
        const oldUser = users.find(u => u.id === oldUserId);
        
        if (oldUser) {
          const newUserId = addUser({
            ...oldUser,
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            status: formData.status
          });
          
          updateProfessor(editingId, { ...formData, userId: newUserId });
          deleteUser(oldUserId);
        } else {
          updateProfessor(editingId, formData);
        }
      } else if (prof && prof.userId) {
        // Email didn't change, just update the user
        updateUser(prof.userId, {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          status: formData.status
        });
        updateProfessor(editingId, formData);
      } else {
        // Professor exists but has no userId, create the user
        const adminUser = users.find(u => u.role === 'Admin');
        const schoolCode = currentUser?.schoolCode || adminUser?.schoolCode || '';
        if (!schoolCode) {
          showToast("Code établissement introuvable. Reconnectez-vous.", 'error');
          return;
        }
        const profUsers = users.filter(u => u.role === 'Professeur' && u.loginId?.startsWith(schoolCode));
        let nextSuffix = 1;
        if (profUsers.length > 0) {
          const suffixes = profUsers.map(u => {
            const suffixStr = u.loginId?.replace(schoolCode, '');
            return parseInt(suffixStr || '0', 10);
          }).filter(n => !isNaN(n));
          if (suffixes.length > 0) {
            nextSuffix = Math.max(...suffixes) + 1;
          }
        }
        const loginId = `${schoolCode}${nextSuffix.toString().padStart(3, '0')}`;

        const newUserId = addUser({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          loginId: loginId,
          password: 'professeur',
          role: 'Professeur',
          status: formData.status,
          schoolId: adminUser?.schoolId,
          permissions: {
            planning: { view: true, add: false, edit: false, delete: false },
            payroll: { view: true, add: false, edit: false, delete: false },
            users: { view: false, add: false, edit: false, delete: false },
            settings: { view: false, add: false, edit: false, delete: false },
          }
        });
        updateProfessor(editingId, { ...formData, userId: newUserId });
      }
      setIsModalOpen(false);
      resetForm();
      showToast(`Professeur ${formData.firstName} ${formData.lastName} modifié(e) avec succès.`, 'success');
      return;
    } else {
      // Check if professor with this email already exists
      const existingProf = professors.find(p => p.email.toLowerCase() === formData.email.toLowerCase());
      if (existingProf) {
        showToast(`Un professeur avec l'email ${formData.email} existe déjà.`, 'warning');
        setIsModalOpen(false);
        resetForm();
        return;
      }

      // Generate login ID sequentially based on school code
      const adminUser = users.find(u => u.role === 'Admin');
      const schoolCode = currentUser?.schoolCode || adminUser?.schoolCode || '';
      if (!schoolCode) {
        showToast("Code établissement introuvable. Reconnectez-vous.", 'error');
        setIsModalOpen(false);
        resetForm();
        return;
      }
      
      // Find the highest existing professor suffix for this school code
      const profUsers = users.filter(u => u.role === 'Professeur' && u.loginId?.startsWith(schoolCode));
      let nextSuffix = 1;
      if (profUsers.length > 0) {
        const suffixes = profUsers.map(u => {
          const suffixStr = u.loginId?.replace(schoolCode, '');
          return parseInt(suffixStr || '0', 10);
        }).filter(n => !isNaN(n));
        if (suffixes.length > 0) {
          nextSuffix = Math.max(...suffixes) + 1;
        }
      }
      
      const loginId = `${schoolCode}${nextSuffix.toString().padStart(3, '0')}`;
      
      // Stocker les données et demander confirmation
      setPendingFormData({ ...formData, _loginId: loginId, _adminUser: adminUser } as any);
      setIsConfirmAddOpen(true);
      return; // Ne pas fermer la modal principale encore
    }
    setIsModalOpen(false);
    resetForm();
  };

  const confirmAddProfessor = async () => {
    if (!pendingFormData) return;
    const { _loginId, _adminUser, ...profData } = pendingFormData as any;

    setIsAddingProf(true);
    const schoolId = currentUser?.schoolId || _adminUser?.schoolId || '';
    const name     = `${profData.firstName} ${profData.lastName}`;
    const email    = profData.email || `${_loginId}@edutime.local`;
    const perms    = {
      planning: { view: true,  add: false, edit: false, delete: false },
      payroll:  { view: true,  add: false, edit: false, delete: false },
      users:    { view: false, add: false, edit: false, delete: false },
      settings: { view: false, add: false, edit: false, delete: false },
    };

    setIsConfirmAddOpen(false);

    // ── Création du compte en DB (appel BLOQUANT — on attend la réponse) ──
    let userId: string = _loginId;
    try {
      const created = await api.users.create({
        name, email, login_id: _loginId, password: 'professeur',
        role: 'Professeur', status: profData.status || 'Actif',
        school_id: schoolId, permissions: perms,
      });
      userId = created?.id || _loginId;
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('409') || msg.includes('déjà') || msg.includes('conflict')) {
        // L'utilisateur existe déjà en DB (tentative précédente) → mise à jour
        try {
          const existingList = await api.users.list({ school_id: schoolId });
          const list = Array.isArray(existingList) ? existingList : (existingList?.data || []);
          const existing = list.find((u: any) => u.login_id === _loginId);
          if (existing) {
            await api.users.update(existing.id, {
              name, role: 'Professeur', status: profData.status || 'Actif',
              permissions: perms, password: 'professeur', login_id: _loginId,
            });
            userId = existing.id;
          }
        } catch {
          setIsAddingProf(false);
          showToast(`❌ Impossible de créer le compte pour l'identifiant ${_loginId}. Réessayez.`, 'error', 7000);
          setPendingFormData(null);
          setIsModalOpen(false);
          resetForm();
          return;
        }
      } else {
        setIsAddingProf(false);
        showToast(`❌ Erreur serveur : ${err?.message || 'Connexion API impossible.'}`, 'error', 7000);
        setPendingFormData(null);
        setIsModalOpen(false);
        resetForm();
        return;
      }
    }

    // ── Succès — enregistrement local ──────────────────────────────────────
    addUser({ name, email, loginId: _loginId, password: 'professeur',
              role: 'Professeur', status: profData.status, schoolId, permissions: perms });
    addProfessor({ ...profData, availabilities: [], subjectIds: [], userId });

    setIsAddingProf(false);
    setPendingFormData(null);
    setIsModalOpen(false);
    resetForm();

    showToast(
      `✅ ${name} ajouté(e) — Identifiant : ${_loginId} | Mdp : professeur`,
      'success', 7000
    );
  };

  const resetForm = () => {
    setEditingId(null);
    setIsCustomSpecialty(false);
    setFormData({
      firstName: '',
      lastName: '',
      gender: 'M',
      birthDate: '',
      phone: '',
      email: '',
      address: '',
      specialty: '',
      contractType: 'Temps plein',
      hourlyRate: 0,
      status: 'Actif',
      hireDate: new Date().toISOString().split('T')[0],
      photoUrl: undefined,
    });
  };

  const openEdit = (prof: Professor) => {
    setEditingId(prof.id);
    const isCustom = prof.specialty && !PREDEFINED_SUBJECTS.includes(prof.specialty);
    setIsCustomSpecialty(!!isCustom);
    setFormData({
      firstName: prof.firstName,
      lastName: prof.lastName,
      gender: prof.gender,
      birthDate: prof.birthDate,
      phone: prof.phone,
      email: prof.email,
      address: prof.address,
      specialty: prof.specialty,
      contractType: prof.contractType,
      hourlyRate: prof.hourlyRate,
      status: prof.status,
      hireDate: prof.hireDate,
      photoUrl: prof.photoUrl,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Professeurs</h1>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Ajouter un professeur
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou spécialité..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Nom & Prénoms</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Spécialité</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">ID Connexion</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Téléphone</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Taux Horaire</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Statut</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Heures (Mois)</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProfessors.map((prof) => {
                const userLoginId = users.find(u => u.id === prof.userId)?.loginId;

                return (
                  <tr key={prof.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {prof.photoUrl ? (
                          <img src={prof.photoUrl} alt={`${prof.firstName} ${prof.lastName}`} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium text-sm">
                            {(prof.firstName?.[0] || '')}{(prof.lastName?.[0] || '')}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{prof.lastName} {prof.firstName}</p>
                          <p className="text-xs text-gray-500">{prof.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{prof.specialty}</td>
                    <td className="px-6 py-4 text-sm text-indigo-600 font-mono select-all">
                      {userLoginId ? (
                        <span className="bg-indigo-50 px-2 py-1 rounded border border-indigo-100">{userLoginId}</span>
                      ) : (
                        <span className="text-gray-400 italic">Non défini</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{prof.phone}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{prof.hourlyRate?.toLocaleString() || 0} {settings?.currency || '€'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        prof.status === 'Actif' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {prof.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{calculateHours(prof.id)}h</td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                    <button
                      onClick={() => setViewingProfId(prof.id)}
                      className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Voir la fiche"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEdit(prof)}
                      className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setProfToDelete(prof)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
                );
              })}
              {filteredProfessors.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="w-8 h-8 text-gray-300 mb-2" />
                      <p>Aucun professeur trouvé.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Voir Détails */}
      {viewingProfId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <Eye className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Profil du Professeur</h2>
              </div>
              <button
                onClick={() => setViewingProfId(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-white custom-scrollbar">
              <ProfessorDetail 
                professorId={viewingProfId} 
                onBack={() => setViewingProfId(null)} 
              />
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setViewingProfId(null)}
                className="px-6 py-2 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all shadow-sm active:scale-95"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajout/Modification */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Modifier le professeur' : 'Nouveau professeur'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="prof-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Photo de profil */}
                <div className="flex flex-col items-center justify-center space-y-4 pb-6 border-b border-gray-200">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                      {formData.photoUrl ? (
                        <img src={formData.photoUrl} alt="Profil" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <label 
                      htmlFor="photo-upload" 
                      className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors shadow-sm"
                      title="Changer la photo"
                    >
                      <Plus className="w-4 h-4" />
                      <input 
                        id="photo-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handlePhotoUpload}
                      />
                    </label>
                  </div>
                  <div className="text-center">
                    <h3 className="text-sm font-medium text-gray-900">Photo de profil</h3>
                    <p className="text-xs text-gray-500">JPG, PNG ou GIF (Max. 2MB)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Informations personnelles */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Informations Personnelles</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                        <input type="text" required value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                        <input type="text" required value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
                        <select value={formData.gender || 'M'} onChange={e => setFormData({...formData, gender: e.target.value as Gender})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                          <option value="M">Homme</option>
                          <option value="F">Femme</option>
                          <option value="Autre">Autre</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                        <input type="date" value={formData.birthDate || ''} onChange={e => setFormData({...formData, birthDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                      <input type="tel" required value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input type="email" required value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                      <textarea rows={2} value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                  </div>

                  {/* Informations professionnelles */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Informations Professionnelles</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Spécialité *</label>
                      <select
                        required={!isCustomSpecialty}
                        value={isCustomSpecialty ? 'Autres' : (formData.specialty || '')}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === 'Autres') {
                            setIsCustomSpecialty(true);
                            setFormData({ ...formData, specialty: '' });
                          } else {
                            setIsCustomSpecialty(false);
                            setFormData({ ...formData, specialty: val });
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Sélectionner une matière...</option>
                        {PREDEFINED_SUBJECTS.map((subject) => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                        <option value="Autres">Autres</option>
                      </select>
                      
                      {isCustomSpecialty && (
                        <input 
                          type="text" 
                          required 
                          value={formData.specialty || ''} 
                          onChange={e => setFormData({...formData, specialty: e.target.value})} 
                          placeholder="Saisissez la matière" 
                          className="w-full px-3 py-2 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type de contrat</label>
                        <select value={formData.contractType || 'Permanent'} onChange={e => setFormData({...formData, contractType: e.target.value as ContractType})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                          <option value="Temps plein">Temps plein</option>
                          <option value="Vacataire">Vacataire</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                        <select value={formData.status || 'Actif'} onChange={e => setFormData({...formData, status: e.target.value as ProfessorStatus})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                          <option value="Actif">Actif</option>
                          <option value="Inactif">Inactif</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Taux Horaire ({settings?.currency || '€'}) *</label>
                        <input type="number" required min="0" step="0.5" value={formData.hourlyRate || 0} onChange={e => setFormData({...formData, hourlyRate: parseFloat(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date d'embauche</label>
                        <input type="date" value={formData.hireDate || ''} onChange={e => setFormData({...formData, hireDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-gray-200 mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    {editingId ? 'Enregistrer les modifications' : 'Ajouter le professeur'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!profToDelete}
        onClose={() => setProfToDelete(null)}
        onConfirm={async () => {
          if (profToDelete) {
            try {
              if (profToDelete.userId) {
                try {
                  await deleteUser(profToDelete.userId);
                } catch (userErr) {
                  console.warn("Could not delete associated user:", userErr);
                  // Continuons pour supprimer le professeur même si l'utilisateur a échoué (ex: permissions manquantes pour un gestionnaire)
                }
              }
              await deleteProfessor(profToDelete.id);
              const name = `${profToDelete.firstName} ${profToDelete.lastName}`;
              setProfToDelete(null);
              showToast(`Professeur ${name} supprimé.`, 'info');
            } catch (error: any) {
              showToast("Erreur lors de la suppression.", 'error');
            }
          }
        }}
        title="Supprimer le professeur"
        message="Êtes-vous sûr de vouloir supprimer ce professeur ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        isDanger
      />

      {/* Modal de confirmation d'ajout */}
      {isConfirmAddOpen && pendingFormData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsConfirmAddOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirmer l'ajout</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Voulez-vous ajouter <strong>{(pendingFormData as any).firstName} {(pendingFormData as any).lastName}</strong> comme professeur ?
                </p>
                <p className="text-xs text-indigo-600 mt-2 bg-indigo-50 rounded-lg px-3 py-2">
                  Un identifiant de connexion lui sera automatiquement attribué.
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => { setIsConfirmAddOpen(false); setPendingFormData(null); }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmAddProfessor}
                  disabled={isAddingProf}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isAddingProf ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Création en cours...
                    </>
                  ) : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

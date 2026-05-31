import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  ArrowLeft, Mail, Phone, MapPin, Calendar, Clock, BookOpen, 
  Briefcase, CheckCircle2, XCircle, Building2, Globe, ExternalLink 
} from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function ProfessorDetail({ professorId, onBack }: { professorId?: string, onBack?: () => void }) {
  const params = useParams<{ id: string }>();
  const id = professorId || params.id;
  const navigate = useNavigate();
  const { professors, courses, subjects, classes, settings } = useStore();
  const [otherSchools, setOtherSchools] = useState<any[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);

  const professor = professors.find(p => p.id === id);

  useEffect(() => {
    const fetchOtherSchools = async () => {
      if (!professor?.email) return;
      
      setLoadingSchools(true);
      try {
        const professorsRef = collection(db, 'professors');
        const q = query(professorsRef, where('email', '==', professor.email.trim()));
        const querySnapshot = await getDocs(q);
        
        const schoolIds = new Set<string>();
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.schoolId !== professor.schoolId) {
            schoolIds.add(data.schoolId);
          }
        });

        if (schoolIds.size === 0) {
          setOtherSchools([]);
          return;
        }

        const schoolsData = await Promise.all(
            Array.from(schoolIds).map(async (sId) => {
                const settingsDoc = await getDoc(doc(db, 'settings', sId));
                if (settingsDoc.exists()) {
                    return { id: sId, ...settingsDoc.data() };
                }
                return null;
            })
        );

        setOtherSchools(schoolsData.filter(s => s !== null));
      } catch (error) {
        console.error("Error fetching other schools:", error);
      } finally {
        setLoadingSchools(false);
      }
    };

    fetchOtherSchools();
  }, [professor?.email, professor?.schoolId]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/professors');
    }
  };

  if (!professor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Professeur introuvable.</p>
        <button onClick={handleBack} className="mt-4 text-indigo-600 hover:underline">
          Retour à la liste
        </button>
      </div>
    );
  }

  // Calculate stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const profCourses = courses.filter(c => c.professorId === id);
  const currentMonthCourses = profCourses.filter(c => {
    if (!c.date) return false;
    try {
      const d = parseISO(c.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    } catch (e) {
      return false;
    }
  });

  const calculateHours = (courseList: typeof courses) => {
    return courseList.reduce((acc, course) => {
      const start = new Date(`2000-01-01T${course.startTime}`);
      const end = new Date(`2000-01-01T${course.endTime}`);
      return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);
  };

  const totalHoursMonth = calculateHours(currentMonthCourses);
  const doneHours = calculateHours(currentMonthCourses.filter(c => c.status === 'present'));
  const absentHours = calculateHours(currentMonthCourses.filter(c => c.status === 'absent'));
  const lateHours = calculateHours(currentMonthCourses.filter(c => c.status === 'late'));

  const getDayName = (dayOfWeek: number) => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[dayOfWeek % 7];
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <button 
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        {professor.photoUrl ? (
          <img src={professor.photoUrl} alt={`${professor.firstName} ${professor.lastName}`} className="w-16 h-16 rounded-full object-cover border border-gray-200" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl border border-indigo-200">
            {professor.firstName.charAt(0)}{professor.lastName.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {professor.firstName} {professor.lastName}
          </h1>
          <p className="text-gray-500">{professor.specialty}</p>
        </div>
        <div className="ml-auto">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            professor.status === 'Actif' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
          }`}>
            {professor.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations Générales */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Informations Générales
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-600">
              <Mail className="w-5 h-5 text-gray-400" />
              <span>{professor.email}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Phone className="w-5 h-5 text-gray-400" />
              <span>{professor.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span>{professor.address}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span>Né(e) le {professor.birthDate ? format(parseISO(professor.birthDate), 'd MMMM yyyy', { locale: fr }) : 'Non renseigné'}</span>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">Sexe: <span className="font-medium text-gray-900">{professor.gender}</span></p>
            </div>
          </div>
        </div>

        {/* Informations Professionnelles */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            Informations Professionnelles
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Type de contrat</p>
              <p className="font-medium text-gray-900">{professor.contractType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Taux horaire</p>
              <p className="font-medium text-gray-900">{professor.hourlyRate} {settings?.currency || '€'} / h</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date d'embauche</p>
              <p className="font-medium text-gray-900">{professor.hireDate ? format(parseISO(professor.hireDate), 'd MMMM yyyy', { locale: fr }) : 'Non renseignée'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Matières enseignées</p>
              <div className="flex flex-wrap gap-2">
                {professor.subjectIds?.map(subId => {
                  const sub = subjects.find(s => s.id === subId);
                  return sub ? (
                    <span key={subId} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md font-medium">
                      {sub.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques Rapides */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Statistiques (Ce mois)
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Total planifié</p>
              <p className="text-2xl font-bold text-gray-900">{totalHoursMonth}h</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
              <p className="text-sm text-emerald-600 mb-1">Effectuées</p>
              <p className="text-2xl font-bold text-emerald-700">{doneHours}h</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <p className="text-sm text-red-600 mb-1">Absences</p>
              <p className="text-2xl font-bold text-red-700">{absentHours}h</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
              <p className="text-sm text-amber-600 mb-1">Retards</p>
              <p className="text-2xl font-bold text-amber-700">{lateHours}h</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Disponibilités */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Disponibilités</h2>
          {!professor.availabilities || professor.availabilities.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucune disponibilité renseignée.</p>
          ) : (
            <div className="space-y-3">
              {professor.availabilities.map(avail => (
                <div key={avail.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="font-medium text-gray-900">{getDayName(avail.dayOfWeek)}</span>
                  <span className="text-sm text-gray-600">{avail.startTime} - {avail.endTime}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Historique récent */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Historique récent</h2>
          {profCourses.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucun cours dans l'historique.</p>
          ) : (
            <div className="space-y-4">
              {profCourses.slice(0, 5).map(course => {
                const cls = classes.find(c => c.id === course.classId);
                const sub = subjects.find(s => s.id === course.subjectId);
                return (
                  <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900">{sub?.name} - {cls?.name}</p>
                      <p className="text-sm text-gray-500">{course.date ? format(parseISO(course.date), 'd MMM yyyy', { locale: fr }) : 'Date inconnue'} • {course.startTime}-{course.endTime}</p>
                    </div>
                    <div>
                      {course.status === 'present' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                      {course.status === 'absent' && <XCircle className="w-5 h-5 text-red-500" />}
                      {course.status === 'late' && <Clock className="w-5 h-5 text-amber-500" />}
                      {course.status === 'scheduled' && <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded-full">Prévu</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Interventions Multi-Établissements */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Interventions Multi-Établissements
          </h2>
          <span className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg">
            Basé sur l'email
          </span>
        </div>
        
        {loadingSchools ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-3">
            <Clock className="w-8 h-8 animate-spin" />
            <p className="text-sm font-medium">Recherche d'autres établissements en cours...</p>
          </div>
        ) : otherSchools.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500 text-sm">Ce professeur n'intervient dans aucun autre établissement enregistré avec cet email.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherSchools.map(school => (
              <div key={school.id} className="group p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                    {school.logo ? (
                      <img src={school.logo} alt="" className="w-full h-full object-contain rounded-xl" />
                    ) : (
                      <Building2 className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{school.schoolName}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{school.address || "Lieu non précisé"}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2.5 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span className="font-medium">{school.phone || "Non renseigné"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="font-medium truncate" title={school.email}>{school.email || "Non renseigné"}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 flex justify-end">
                  <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                    Actif dans cet établissement <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

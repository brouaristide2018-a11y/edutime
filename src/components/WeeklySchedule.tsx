import React, { useState, useMemo } from 'react';
import { useStore, Course } from '../store';
import { format, startOfWeek, addDays, parseISO, isSameDay, getDay, isSameWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, X, Trash2, Edit2, AlertTriangle, Filter } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface WeeklyScheduleProps {
  type: 'prof' | 'class';
  id: string;
  readOnly?: boolean;
}

export function WeeklySchedule({ type, id, readOnly = false }: WeeklyScheduleProps) {
  const { courses, professors, classes, subjects, rooms, classSubjectProfessors, addCourse, updateCourse, deleteCourse, currentUser } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Course>>({
    professorId: type === 'prof' ? id : '',
    classId: type === 'class' ? id : '',
    subjectId: '',
    roomId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '08:00',
    endTime: '10:00'
  });
  
  // Conflict State
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Repeat State
  const [isRepeating, setIsRepeating] = useState(true);
  const [repeatWeeks, setRepeatWeeks] = useState(1);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const storeTimeSlots = useStore(state => state.timeSlots);
  const timeSlots = storeTimeSlots.length > 0 
    ? storeTimeSlots 
    : Array.from({ length: 12 }).map((_, i) => {
        const hour = i + 7; // 7:00 to 18:00
        const time = `${hour.toString().padStart(2, '0')}:00`;
        return { id: `default-${i}`, startTime: time, endTime: `${(hour + 1).toString().padStart(2, '0')}:00`, name: '' };
      });

  const availableClasses = useMemo(() => {
    if (type === 'prof') {
      const assignments = classSubjectProfessors.filter(a => a.professorId === id);
      return classes.filter(c => assignments.some(a => a.classId === c.id));
    }
    return classes;
  }, [type, id, classSubjectProfessors, classes]);

  // Derived options based on selections
  const availableSubjects = useMemo(() => {
    if (!formData.classId) return [];
    let assignments = classSubjectProfessors.filter(a => a.classId === formData.classId);
    if (type === 'prof') {
      assignments = assignments.filter(a => a.professorId === id);
    }
    return subjects.filter(s => assignments.some(a => a.subjectId === s.id));
  }, [formData.classId, classSubjectProfessors, subjects, type, id]);

  const availableProfessors = useMemo(() => {
    if (!formData.classId || !formData.subjectId) return [];
    const assignments = classSubjectProfessors.filter(a => a.classId === formData.classId && a.subjectId === formData.subjectId);
    return professors.filter(p => assignments.some(a => a.professorId === p.id));
  }, [formData.classId, formData.subjectId, classSubjectProfessors, professors]);

  // Auto-select professor if only one is available for the class+subject
  React.useEffect(() => {
    if (availableProfessors.length === 1 && formData.professorId !== availableProfessors[0].id) {
      setFormData(prev => ({ ...prev, professorId: availableProfessors[0].id }));
    }
  }, [availableProfessors, formData.professorId]);

  const checkConflicts = async (courseData: Partial<Course>, excludeCourseId?: string) => {
    const { date, startTime, endTime, professorId, classId, roomId, subjectId } = courseData;
    
    if (!date || !startTime || !endTime || !professorId || !classId || !subjectId) return null;

    const parsedDate = parseISO(date);
    const jsDay = getDay(parsedDate);
    const dayOfWeek = jsDay === 0 ? 7 : jsDay; // 1 = Monday, 7 = Sunday

    // 1. Check Professor Conflicts
    const prof = professors.find(p => p.id === professorId);
    if (prof) {
      // 1.1 Global Conflict Check (Other Schools)
      if (prof.email) {
        try {
          const q = query(
            collection(db, 'courses'), 
            where('date', '==', date),
            where('professorEmail', '==', prof.email)
          );
          const querySnapshot = await getDocs(q);
          const otherCourses = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Course))
            .filter(c => c.schoolId !== currentUser?.schoolId && c.id !== excludeCourseId);

          for (const c of otherCourses) {
            if (startTime < c.endTime && endTime > c.startTime) {
              return `Le professeur est déjà pris dans un autre établissement (${c.schoolName || 'Inconnu'}) de ${c.startTime} à ${c.endTime}. Veuillez choisir un autre créneau.`;
            }
          }
        } catch (err) {
          console.warn("Erreur lors de la vérification globale des conflits:", err);
        }
      }
    }

    // 2. Check Overlaps (Local School)
    const overlappingCourses = courses.filter(c => {
      if (excludeCourseId && c.id === excludeCourseId) return false;
      if (c.date !== date) return false;
      
      // Check time overlap
      return (startTime < c.endTime && endTime > c.startTime);
    });

    for (const c of overlappingCourses) {
      if (c.professorId === professorId) return `Le professeur est déjà occupé de ${c.startTime} à ${c.endTime}.`;
      if (c.classId === classId) return `La classe a déjà cours de ${c.startTime} à ${c.endTime}.`;
      if (roomId && c.roomId === roomId) return `La salle est déjà occupée de ${c.startTime} à ${c.endTime}.`;
    }

    // 3. Check Volume Horaire
    const subject = subjects.find(s => s.id === subjectId);
    if (subject) {
      const maxHours = subject.weeklyHours;
      const courseDuration = (parseInt(endTime.split(':')[0]) + parseInt(endTime.split(':')[1])/60) - 
                             (parseInt(startTime.split(':')[0]) + parseInt(startTime.split(':')[1])/60);
                             
      const classCoursesThisWeek = courses.filter(c => {
        if (excludeCourseId && c.id === excludeCourseId) return false;
        return c.classId === classId && 
               c.subjectId === subjectId && 
               isSameWeek(parseISO(c.date), parsedDate, { weekStartsOn: 1 });
      });

      const currentHours = classCoursesThisWeek.reduce((total, c) => {
        const duration = (parseInt(c.endTime.split(':')[0]) + parseInt(c.endTime.split(':')[1])/60) - 
                         (parseInt(c.startTime.split(':')[0]) + parseInt(c.startTime.split(':')[1])/60);
        return total + duration;
      }, 0);

      if (currentHours + courseDuration > maxHours) {
        return `Le volume horaire hebdomadaire pour cette matière (${maxHours}h) serait dépassé.`;
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const courseDataToSave = {
      ...formData,
      schoolName: useStore.getState().settings.schoolName
    };
    
    setConflictError(null);

    if (editingCourseId) {
      const conflict = await checkConflicts(courseDataToSave, editingCourseId);
      if (conflict) {
        setConflictError(conflict);
        return;
      }
      updateCourse(editingCourseId, courseDataToSave);
    } else {
      // Check conflicts for all repeated courses first
      const coursesToAdd: Omit<Course, 'id' | 'status'>[] = [];
      const weeks = isRepeating ? repeatWeeks : 1;
      
      for (let i = 0; i < weeks; i++) {
        const courseDate = format(addDays(parseISO(courseDataToSave.date!), i * 7), 'yyyy-MM-dd');
        const courseData = { ...courseDataToSave, date: courseDate } as Omit<Course, 'id' | 'status'>;
        
        const conflict = await checkConflicts(courseData);
        if (conflict) {
          setConflictError(`Conflit pour le cours du ${format(parseISO(courseDate), 'dd/MM/yyyy')} : ${conflict}`);
          return;
        }
        coursesToAdd.push(courseData);
      }

      // If no conflicts, add all courses
      coursesToAdd.forEach(course => addCourse(course));
    }
    
    closeModal();
  };

  const openModal = (course?: Course, slotDate?: string, slotStartTime?: string, slotEndTime?: string) => {
    if (readOnly) return;
    setConflictError(null);
    setIsRepeating(!course); // Default to true for new courses, keep false for existing
    setRepeatWeeks(12); // Default to 12 weeks for a term
    if (course) {
      setEditingCourseId(course.id);
      setFormData(course);
    } else {
      setEditingCourseId(null);
      setFormData({
        professorId: type === 'prof' ? id : '',
        classId: type === 'class' ? id : '',
        subjectId: '',
        roomId: '',
        date: slotDate || format(new Date(), 'yyyy-MM-dd'),
        startTime: slotStartTime || '08:00',
        endTime: slotEndTime || (slotStartTime ? `${parseInt(slotStartTime.split(':')[0]) + 2}:00` : '10:00')
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCourseId(null);
    setConflictError(null);
  };

  const getCoursesForSlot = (date: Date, slotStartTime: string, slotEndTime: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return courses.filter(c => {
      if (c.date !== dateStr) return false;
      if (type === 'class' && c.classId !== id) return false;
      if (type === 'prof' && c.professorId !== id) return false;
      // Check if course overlaps with this slot
      return c.startTime < slotEndTime && c.endTime > slotStartTime;
    });
  };

  // Calculate height and position for course blocks
  const getCourseStyle = (course: Course, slotStartTime: string, slotEndTime: string) => {
    // Only render the card in the slot where it starts
    if (course.startTime < slotStartTime || course.startTime >= slotEndTime) return { display: 'none' };

    const startHour = parseInt(course.startTime.split(':')[0]);
    const startMin = parseInt(course.startTime.split(':')[1]);
    const endHour = parseInt(course.endTime.split(':')[0]);
    const endMin = parseInt(course.endTime.split(':')[1]);
    
    const slotStartHour = parseInt(slotStartTime.split(':')[0]);
    const slotStartMin = parseInt(slotStartTime.split(':')[1]);
    const slotEndHour = parseInt(slotEndTime.split(':')[0]);
    const slotEndMin = parseInt(slotEndTime.split(':')[1]);

    const slotDurationMinutes = (slotEndHour - slotStartHour) * 60 + (slotEndMin - slotStartMin);
    const courseDurationMinutes = (endHour - startHour) * 60 + (endMin - startMin);
    
    const offsetMinutes = (startHour - slotStartHour) * 60 + (startMin - slotStartMin);
    const topOffset = (offsetMinutes / slotDurationMinutes) * 100; // Percentage offset from top of slot
    const height = (courseDurationMinutes / slotDurationMinutes) * 100; // Height relative to slot duration

    const subject = subjects.find(s => s.id === course.subjectId);
    const color = subject?.color || '#3b82f6';

    return {
      top: `${topOffset}%`,
      height: `calc(${height}% + ${(Math.floor(courseDurationMinutes / slotDurationMinutes) - 1)}px)`, // Adjust for borders
      backgroundColor: `${color}15`, // 15% opacity
      borderColor: color,
      borderLeftWidth: '4px',
    };
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Week Navigation */}
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setCurrentDate(addDays(currentDate, -7))}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              Préc.
            </button>
            <span className="px-3 py-1 text-sm font-medium text-gray-900 min-w-[140px] text-center">
              {format(weekStart, 'd MMM', { locale: fr })} - {format(addDays(weekStart, 5), 'd MMM yyyy', { locale: fr })}
            </span>
            <button
              onClick={() => setCurrentDate(addDays(currentDate, 7))}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              Suiv.
            </button>
          </div>
          {!readOnly && (
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nouveau Cours
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
        <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
          <div className="p-4 border-r border-gray-200 text-center text-sm font-medium text-gray-500">
            Heure
          </div>
          {weekDays.map((date) => {
            const isToday = isSameDay(date, new Date());
            return (
              <div key={date.toISOString()} className={`p-4 border-r border-gray-200 text-center ${isToday ? 'bg-indigo-50' : ''}`}>
                <div className={`text-sm font-medium capitalize ${isToday ? 'text-indigo-700' : 'text-gray-900'}`}>
                  {format(date, 'EEEE', { locale: fr })}
                </div>
                <div className={`text-sm ${isToday ? 'text-indigo-600 font-bold' : 'text-gray-500'}`}>
                  {format(date, 'd MMM', { locale: fr })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto relative min-h-[500px]">
          {timeSlots.map((timeSlot, index) => (
            <div key={timeSlot.id} className="grid grid-cols-8 border-b border-gray-100 min-h-[100px]">
              <div className="p-2 border-r border-gray-200 text-center text-xs font-medium text-gray-500 bg-gray-50 flex flex-col items-center justify-center gap-1">
                <span className="font-bold text-gray-700">Nº {index + 1}</span>
                {timeSlot.type && timeSlot.type !== 'Cours' && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    timeSlot.type === 'Recréation' ? 'bg-green-100 text-green-800' :
                    timeSlot.type === 'Après-Midi' ? 'bg-orange-100 text-orange-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {timeSlot.type}
                  </span>
                )}
                <span>{timeSlot.startTime}</span>
                <span className="text-gray-400">-</span>
                <span>{timeSlot.endTime}</span>
              </div>
              {weekDays.map((date) => {
                const slotCourses = getCoursesForSlot(date, timeSlot.startTime, timeSlot.endTime);
                const dateStr = format(date, 'yyyy-MM-dd');
                
                return (
                  <div 
                    key={date.toISOString()} 
                    className={`p-1 border-r border-gray-100 relative ${!readOnly ? 'cursor-pointer hover:bg-gray-50/100' : ''} transition-colors group`}
                    onClick={(e) => {
                      if (!readOnly && e.target === e.currentTarget) {
                        openModal(undefined, dateStr, timeSlot.startTime, timeSlot.endTime);
                      }
                    }}
                  >
                    {!readOnly && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0">
                        <div className="bg-indigo-600 text-white rounded-full p-1 shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                          <Plus className="w-5 h-5" />
                        </div>
                      </div>
                    )}
                    {slotCourses.map(course => {
                      const prof = professors.find(p => p.id === course.professorId);
                      const cls = classes.find(c => c.id === course.classId);
                      const sub = subjects.find(s => s.id === course.subjectId);
                      const room = rooms.find(r => r.id === course.roomId);
                      
                      const style = getCourseStyle(course, timeSlot.startTime, timeSlot.endTime);
                      if (style.display === 'none') return null;

                      return (
                        <div 
                          key={course.id} 
                          className="absolute inset-x-1 z-10 rounded-md p-2 shadow-sm group overflow-hidden border border-r-0 border-t-0 border-b-0 flex flex-col"
                          style={style}
                          onClick={(e) => {
                            if (!readOnly) {
                              e.stopPropagation();
                              openModal(course);
                            }
                          }}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-xs font-bold text-gray-900 truncate pr-2">{sub?.name}</p>
                            {!readOnly && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCourseToDelete(course.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity flex-shrink-0 bg-white/80 rounded p-0.5"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <div className="flex-1 min-h-0 text-[11px] leading-tight text-gray-700 space-y-0.5">
                            <p className="font-bold">Classe ({cls?.name || '?'})</p>
                            <p className="text-indigo-700 font-semibold">Matière ({sub?.name || '?'})</p>
                            <p className="truncate text-[10px]">{prof ? `${prof.firstName} ${prof.lastName}` : 'Inconnu'}</p>
                            {room && <p className="text-gray-500 truncate text-[10px]">Salle: {room.name}</p>}
                            {course.schoolName && <p className="text-amber-600 font-bold truncate text-[9px] uppercase tracking-wider">{course.schoolName}</p>}
                          </div>
                          <p className="text-[10px] font-medium text-gray-500 mt-1">
                            {course.startTime} - {course.endTime}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && !readOnly && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCourseId ? 'Modifier le cours' : 'Planifier un cours'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {conflictError && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-800">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{conflictError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Classe *</label>
                <select
                  required
                  value={formData.classId || ''}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value, subjectId: '', professorId: type === 'prof' ? id : '' })}
                  disabled={type === 'class'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white disabled:bg-gray-100"
                >
                  <option value="">Sélectionner une classe</option>
                  {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matière *</label>
                <select
                  required
                  value={formData.subjectId || ''}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value, professorId: type === 'prof' ? id : '' })}
                  disabled={!formData.classId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white disabled:bg-gray-100"
                >
                  <option value="">Sélectionner une matière</option>
                  {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {formData.classId && availableSubjects.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Aucune matière n'est assignée à cette classe.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Professeur *</label>
                <select
                  required
                  value={formData.professorId || ''}
                  onChange={(e) => setFormData({ ...formData, professorId: e.target.value })}
                  disabled={!formData.subjectId || type === 'prof'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white disabled:bg-gray-100"
                >
                  <option value="">Sélectionner un professeur</option>
                  {availableProfessors.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salle (Optionnel)</label>
                <select
                  value={formData.roomId || ''}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="">Sélectionner une salle</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.capacity} places)</option>)}
                </select>
              </div>

              <div className="hidden">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date || ''}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure de début *</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime || ''}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure de fin *</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime || ''}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Durée rapide</label>
                <div className="flex gap-2">
                  {[1, 2, 3].map(hours => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => {
                        if (formData.startTime) {
                          const [h, m] = formData.startTime.split(':').map(Number);
                          const endH = h + hours;
                          setFormData({ ...formData, endTime: `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}` });
                        }
                      }}
                      className="flex-1 px-3 py-2 text-sm font-medium bg-gray-50 text-gray-700 rounded-lg border border-gray-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all"
                    >
                      {hours}H
                    </button>
                  ))}
                </div>
              </div>

              {!editingCourseId && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      id="repeat"
                      checked={isRepeating}
                      onChange={(e) => setIsRepeating(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="repeat" className="text-sm font-medium text-gray-700">
                      Répéter ce cours chaque semaine
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mb-3 ml-6">
                    Le professeur effectuera ce cours avec cette classe chaque semaine, le même jour et à la même heure.
                  </p>
                  
                  {isRepeating && (
                    <div className="pl-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de semaines</label>
                      <input
                        type="number"
                        min="2"
                        max="52"
                        required={isRepeating}
                        value={repeatWeeks}
                        onChange={(e) => setRepeatWeeks(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingCourseId ? 'Mettre à jour' : 'Planifier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!courseToDelete}
        onClose={() => setCourseToDelete(null)}
        onConfirm={() => {
          if (courseToDelete) {
            deleteCourse(courseToDelete);
            setCourseToDelete(null);
          }
        }}
        title="Supprimer le cours"
        message="Êtes-vous sûr de vouloir supprimer ce cours ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
      />
    </div>
  );
}

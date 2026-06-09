import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { format, startOfWeek, addDays, parseISO, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays, Clock, BookOpen, User } from 'lucide-react';

const SUBJECT_COLORS = [
  'bg-indigo-100 border-indigo-300 text-indigo-800',
  'bg-emerald-100 border-emerald-300 text-emerald-800',
  'bg-amber-100 border-amber-300 text-amber-800',
  'bg-rose-100 border-rose-300 text-rose-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-sky-100 border-sky-300 text-sky-800',
  'bg-orange-100 border-orange-300 text-orange-800',
  'bg-teal-100 border-teal-300 text-teal-800',
];

const DOT_COLORS = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
  'bg-purple-500', 'bg-sky-500', 'bg-orange-500', 'bg-teal-500',
];

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export function Schedule() {
  const { courses, professors, classes, subjects } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

  // Associer une couleur stable par matière
  const subjectColorMap = useMemo(() => {
    const map = new Map<string, number>();
    subjects.forEach((s, i) => map.set(s.id, i % SUBJECT_COLORS.length));
    return map;
  }, [subjects]);

  // Cours de la semaine groupés par jour
  const coursesByDay = useMemo(() => {
    return DAYS.map((_, i) => {
      const dayDate = addDays(weekStart, i);
      return courses
        .filter(c => {
          try { return isSameDay(parseISO(c.date), dayDate); } catch { return false; }
        })
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
  }, [courses, weekStart]);

  const totalCourses = coursesByDay.reduce((acc, day) => acc + day.length, 0);

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planning de la semaine</h1>
          <p className="text-sm text-gray-500 mt-0.5">{totalCourses} cours planifiés</p>
        </div>

        {/* Navigation semaine */}
        <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 shadow-sm p-1">
          <button
            onClick={() => setCurrentDate(addDays(currentDate, -7))}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 min-w-[200px] justify-center">
            <CalendarDays className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-gray-800">
              {format(weekStart, 'd MMM', { locale: fr })} –{' '}
              {format(addDays(weekStart, 5), 'd MMM yyyy', { locale: fr })}
            </span>
          </div>
          <button
            onClick={() => setCurrentDate(addDays(currentDate, 7))}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors ml-1"
          >
            Aujourd'hui
          </button>
        </div>
      </div>

      {/* Grille des jours */}
      {totalCourses === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Aucun cours cette semaine</h3>
          <p className="text-sm text-gray-500">Naviguez vers une autre semaine ou ajoutez des cours.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {DAYS.map((dayName, i) => {
            const dayDate = addDays(weekStart, i);
            const dayCourses = coursesByDay[i];
            const isToday = isSameDay(dayDate, new Date());

            return (
              <div
                key={dayName}
                className={`flex flex-col rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  isToday
                    ? 'border-indigo-300 bg-indigo-50/40'
                    : dayCourses.length > 0
                    ? 'border-gray-200 bg-white'
                    : 'border-gray-100 bg-gray-50/60'
                }`}
              >
                {/* En-tête du jour */}
                <div className={`px-4 py-3 border-b ${isToday ? 'bg-indigo-600 border-indigo-600' : 'bg-gray-50 border-gray-100'}`}>
                  <p className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-indigo-200' : 'text-gray-500'}`}>
                    {dayName}
                  </p>
                  <p className={`text-2xl font-extrabold leading-none mt-0.5 ${isToday ? 'text-white' : 'text-gray-900'}`}>
                    {format(dayDate, 'd')}
                  </p>
                  {dayCourses.length > 0 && (
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                      isToday ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {dayCourses.length} cours
                    </span>
                  )}
                </div>

                {/* Cours du jour */}
                <div className="flex-1 p-3 space-y-2 min-h-[80px]">
                  {dayCourses.length === 0 ? (
                    <div className="flex items-center justify-center h-full py-6">
                      <p className="text-xs text-gray-400">Pas de cours</p>
                    </div>
                  ) : (
                    dayCourses.map(course => {
                      const prof = professors.find(p => p.id === course.professorId);
                      const cls = classes.find(c => c.id === course.classId);
                      const sub = subjects.find(s => s.id === course.subjectId);
                      const colorIdx = subjectColorMap.get(course.subjectId) ?? 0;
                      const colorClass = SUBJECT_COLORS[colorIdx];
                      const dotClass = DOT_COLORS[colorIdx];

                      return (
                        <div
                          key={course.id}
                          className={`rounded-xl border p-2.5 text-xs ${colorClass}`}
                        >
                          {/* Heure */}
                          <div className="flex items-center gap-1 mb-1.5">
                            <Clock className="w-3 h-3 opacity-70" />
                            <span className="font-bold">{course.startTime} – {course.endTime}</span>
                          </div>
                          {/* Matière */}
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotClass}`} />
                            <span className="font-semibold truncate" title={sub?.name}>{sub?.name || '—'}</span>
                          </div>
                          {/* Classe */}
                          <div className="flex items-center gap-1 opacity-80 mb-0.5">
                            <BookOpen className="w-3 h-3" />
                            <span className="truncate">{cls?.name || '—'}</span>
                          </div>
                          {/* Professeur */}
                          {prof && (
                            <div className="flex items-center gap-1 opacity-70">
                              <User className="w-3 h-3" />
                              <span className="truncate">{prof.firstName} {prof.lastName}</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

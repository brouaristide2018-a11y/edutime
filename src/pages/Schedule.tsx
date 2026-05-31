import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { format, startOfWeek, addDays, parseISO, isSameWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarDays, Clock, BookOpen, Users } from 'lucide-react';

export function Schedule() {
  const { courses, professors, classes, subjects } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

  // Get all courses for the selected week
  const coursesThisWeek = useMemo(() => {
    return courses.filter(c => isSameWeek(parseISO(c.date), currentDate, { weekStartsOn: 1 }));
  }, [courses, currentDate]);

  // Group courses by professor
  const professorsWithCourses = useMemo(() => {
    const profMap = new Map();

    coursesThisWeek.forEach(course => {
      if (!profMap.has(course.professorId)) {
        const prof = professors.find(p => p.id === course.professorId);
        if (prof) {
          profMap.set(course.professorId, {
            professor: prof,
            courses: [],
            totalMinutes: 0
          });
        }
      }

      const profData = profMap.get(course.professorId);
      if (profData) {
        profData.courses.push(course);
        
        const startHour = parseInt(course.startTime.split(':')[0]);
        const startMin = parseInt(course.startTime.split(':')[1]);
        const endHour = parseInt(course.endTime.split(':')[0]);
        const endMin = parseInt(course.endTime.split(':')[1]);
        
        profData.totalMinutes += (endHour - startHour) * 60 + (endMin - startMin);
      }
    });

    return Array.from(profMap.values()).sort((a, b) => 
      a.professor.lastName.localeCompare(b.professor.lastName)
    );
  }, [coursesThisWeek, professors]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? mins.toString().padStart(2, '0') : ''}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Planning de la semaine</h1>
        
        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
          <button
            onClick={() => setCurrentDate(addDays(currentDate, -7))}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            Semaine Préc.
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-900 min-w-[200px] justify-center border-x border-gray-100">
            <CalendarDays className="w-4 h-4 text-indigo-600" />
            {format(weekStart, 'd MMM', { locale: fr })} - {format(weekEnd, 'd MMM yyyy', { locale: fr })}
          </div>
          <button
            onClick={() => setCurrentDate(addDays(currentDate, 7))}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            Semaine Suiv.
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Professeurs actifs cette semaine
          </h2>
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
            {professorsWithCourses.length} professeur(s)
          </span>
        </div>

        {professorsWithCourses.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {professorsWithCourses.map(({ professor, courses, totalMinutes }) => (
              <div key={professor.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                      {professor.firstName[0]}{professor.lastName[0]}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {professor.firstName} {professor.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">{professor.specialty}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                      <BookOpen className="w-4 h-4" />
                      <span className="font-medium">{courses.length} cours</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg">
                      <Clock className="w-4 h-4" />
                      <span className="font-bold">{formatDuration(totalMinutes)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {courses.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)).map(course => {
                    const cls = classes.find(c => c.id === course.classId);
                    const sub = subjects.find(s => s.id === course.subjectId);
                    
                    return (
                      <div key={course.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                            {format(parseISO(course.date), 'EEEE d MMM', { locale: fr })}
                          </span>
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {course.startTime} - {course.endTime}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 truncate" title={sub?.name}>{sub?.name}</p>
                          <p className="text-sm text-gray-600 truncate" title={cls?.name}>{cls?.name}</p>
                          {course.schoolName && (
                            <p className="text-xs font-medium text-indigo-600 truncate mt-1" title={course.schoolName}>
                              {course.schoolName}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <CalendarDays className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun cours planifié</h3>
            <p className="text-gray-500">Il n'y a aucun cours prévu pour cette semaine.</p>
          </div>
        )}
      </div>
    </div>
  );
}

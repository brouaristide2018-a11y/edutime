import React, { useState } from 'react';
import { useStore } from '../../store';
import { Calendar, Clock, MapPin, Users, ChevronLeft, ChevronRight, AlertCircle, Clock4 } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ProfSchedule() {
  const currentUser = useStore(state => state.currentUser);
  const professors = useStore(state => state.professors);
  const courses = useStore(state => state.courses);
  const classes = useStore(state => state.classes);
  const subjects = useStore(state => state.subjects);
  const rooms = useStore(state => state.rooms);
  const attendances = useStore(state => state.attendances);

  const [currentDate, setCurrentDate] = useState(new Date());

  const professor = professors.find(p => p.userId === currentUser?.id);

  if (!professor) {
    return <div>Profil professeur introuvable.</div>;
  }

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 6 }).map((_, i) => addDays(startDate, i));

  const timeSlots = Array.from({ length: 11 }).map((_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const getCourseForSlot = (date: Date, timeSlot: string) => {
    return courses.find(c => 
      c.professorId === professor.id &&
      isSameDay(parseISO(c.date), date) &&
      c.startTime <= timeSlot &&
      c.endTime > timeSlot
    );
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Mon Planning</h2>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
            <button 
              onClick={() => navigateWeek('prev')}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="px-4 font-medium text-sm text-gray-900 min-w-[140px] text-center">
              {format(startDate, 'd MMM', { locale: fr })} - {format(addDays(startDate, 5), 'd MMM yyyy', { locale: fr })}
            </div>
            <button 
              onClick={() => navigateWeek('next')}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors"
          >
            Aujourd'hui
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
              <div className="p-4 text-center border-r border-gray-200">
                <Clock className="w-5 h-5 text-gray-400 mx-auto" />
              </div>
              {weekDays.map((day, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "p-4 text-center border-r border-gray-200 last:border-r-0",
                    isSameDay(day, new Date()) && "bg-indigo-50"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium capitalize",
                    isSameDay(day, new Date()) ? "text-indigo-600" : "text-gray-900"
                  )}>
                    {format(day, 'EEEE', { locale: fr })}
                  </div>
                  <div className={cn(
                    "text-xs mt-1",
                    isSameDay(day, new Date()) ? "text-indigo-600 font-bold" : "text-gray-500"
                  )}>
                    {format(day, 'd MMM', { locale: fr })}
                  </div>
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="relative">
              {timeSlots.map((time, i) => (
                <div key={time} className="grid grid-cols-7 border-b border-gray-100 last:border-b-0">
                  <div className="p-3 text-sm text-gray-500 text-center border-r border-gray-200 bg-gray-50/50">
                    {time}
                  </div>
                  {weekDays.map((day, j) => {
                    const course = getCourseForSlot(day, time);
                    const isFirstSlot = course && course.startTime === time;
                    const attendance = course ? attendances.find(a => a.courseId === course.id) : null;
                    
                    return (
                      <div 
                        key={`${i}-${j}`} 
                        className={cn(
                          "p-1 border-r border-gray-100 last:border-r-0 relative min-h-[60px]",
                          isSameDay(day, new Date()) && "bg-indigo-50/30"
                        )}
                      >
                        {isFirstSlot && course && (
                          <div 
                            className={cn(
                              "absolute top-1 left-1 right-1 rounded-lg p-2 shadow-sm border z-10 overflow-hidden",
                              course.status === 'scheduled' ? 'bg-indigo-50 border-indigo-200' :
                              course.status === 'present' ? 'bg-emerald-50 border-emerald-200' :
                              'bg-red-50 border-red-200'
                            )}
                            style={{
                              height: `calc(${
                                (parseInt(course.endTime) - parseInt(course.startTime)) * 100
                              }% - 8px)`
                            }}
                          >
                            <div className="text-xs font-bold text-indigo-900 mb-1">
                              {subjects.find(s => s.id === course.subjectId)?.name}
                            </div>
                            <div className="text-[10px] text-indigo-700 space-y-0.5">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {course.startTime} - {course.endTime}
                              </div>
                              {attendance && attendance.status === 'retard' && (
                                <div className="flex items-center gap-1 text-amber-600 font-medium bg-amber-50/50 rounded px-1 -ml-1">
                                  <Clock4 className="w-3 h-3" />
                                  Retard ({attendance.actualStartTime})
                                </div>
                              )}
                              {attendance && attendance.status === 'absent' && (
                                <div className="flex items-center gap-1 text-red-600 font-medium bg-red-50/50 rounded px-1 -ml-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Absent
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {classes.find(c => c.id === course.classId)?.name}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {rooms.find(r => r.id === course.roomId)?.name}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

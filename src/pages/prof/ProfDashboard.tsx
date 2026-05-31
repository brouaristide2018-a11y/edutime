import React, { useState } from 'react';
import { useStore } from '../../store';
import { Calendar, Clock, AlertCircle, Banknote, MapPin, CheckCircle2, Users, Building2, QrCode, FileText } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export function ProfDashboard() {
  const currentUser = useStore(state => state.currentUser);
  const professors = useStore(state => state.professors);
  const courses = useStore(state => state.courses);
  const classes = useStore(state => state.classes);
  const subjects = useStore(state => state.subjects);
  const rooms = useStore(state => state.rooms);
  const attendances = useStore(state => state.attendances);
  const settings = useStore(state => state.settings);
  const addAttendance = useStore(state => state.addAttendance);

  const professor = professors.find(p => p.userId === currentUser?.id);

  if (!professor) {
    return <div>Profil professeur introuvable.</div>;
  }

  // Get today's courses
  const todayCourses = courses.filter(c => 
    c.professorId === professor.id && 
    isToday(parseISO(c.date))
  ).sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Calculate stats for current month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthAttendances = attendances.filter(a => {
    const date = new Date(a.date);
    return a.professorId === professor.id && 
           date.getMonth() === currentMonth && 
           date.getFullYear() === currentYear;
  });

  const hoursThisMonth = monthAttendances
    .filter(a => a.status === 'present' || a.status === 'retard')
    .reduce((total, a) => total + a.calculatedHours, 0);

  const absencesThisMonth = monthAttendances.filter(a => a.status === 'absent').length;

  const estimatedSalary = hoursThisMonth * professor.hourlyRate;

  const handlePointer = (course: any) => {
    // Calculate hours based on planned time
    const [startH, startM] = course.startTime.split(':').map(Number);
    const [endH, endM] = course.endTime.split(':').map(Number);
    const calculatedHours = (endH + endM / 60) - (startH + startM / 60);

    addAttendance({
      courseId: course.id,
      professorId: course.professorId,
      classId: course.classId,
      subjectId: course.subjectId,
      date: course.date,
      plannedStartTime: course.startTime,
      plannedEndTime: course.endTime,
      actualStartTime: course.startTime, // Automatically use planned start time
      actualEndTime: course.endTime,     // Automatically use planned end time
      status: 'present',
      calculatedHours: calculatedHours
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bonjour, {professor.firstName}</h2>
          <p className="text-gray-500 mt-1">Voici le résumé de votre activité</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Cours aujourd'hui</p>
              <p className="text-2xl font-bold text-gray-900">{todayCourses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Heures ce mois</p>
              <p className="text-2xl font-bold text-gray-900">{hoursThisMonth}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Absences</p>
              <p className="text-2xl font-bold text-gray-900">{absencesThisMonth}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Salaire estimé</p>
              <p className="text-2xl font-bold text-gray-900">
                {estimatedSalary.toLocaleString()} {settings.currency}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Mon planning du jour</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {todayCourses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Aucun cours prévu aujourd'hui.
            </div>
          ) : (
            todayCourses.map(course => {
              const cls = classes.find(c => c.id === course.classId);
              const subject = subjects.find(s => s.id === course.subjectId);
              const room = rooms.find(r => r.id === course.roomId);
              const attendance = attendances.find(a => a.courseId === course.id);

              return (
                <div key={course.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                    <div className="text-center min-w-[80px] sm:min-w-[100px]">
                      <div className="text-base sm:text-lg font-bold text-indigo-600">{course.startTime}</div>
                      <div className="text-xs sm:text-sm text-gray-500">{course.endTime}</div>
                    </div>
                    <div className="hidden sm:block w-px h-12 bg-gray-200"></div>
                    <div className="flex-1">
                      <h4 className="text-base sm:text-lg font-medium text-gray-900">{subject?.name}</h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs sm:text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4" /> {cls?.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4" /> {room?.name}
                        </span>
                        {course.schoolName && (
                          <span className="flex items-center gap-1 text-indigo-600 font-medium">
                            <Building2 className="w-3 h-3 sm:w-4 sm:h-4" /> {course.schoolName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto flex flex-col items-end gap-1">
                    {attendance ? (
                      <>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                          attendance.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                          attendance.status === 'retard' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          <CheckCircle2 className="w-4 h-4" />
                          {attendance.status}
                        </span>
                        {attendance.scannedAt ? (
                          <span className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                            <QrCode className="w-3 h-3" />
                            QR Code
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                            <FileText className="w-3 h-3" />
                            Manuel
                          </span>
                        )}
                      </>
                    ) : (
                      <button 
                        onClick={() => handlePointer(course)}
                        className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                      >
                        Pointer
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

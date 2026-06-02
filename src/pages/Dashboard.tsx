import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { 
  Users, BookOpen, Clock, CalendarDays, CheckCircle2, 
  AlertTriangle, Banknote, TrendingUp, AlertCircle, 
  XCircle, Check, ChevronRight
} from 'lucide-react';
import { 
  format, parseISO, isToday, isSameMonth, 
  startOfMonth, endOfMonth, eachDayOfInterval, 
  subDays, isWithinInterval, startOfWeek, endOfWeek,
  isBefore, parse
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { professors, classes, subjects, courses, attendances, payments, settings } = useStore();
  
  const [periodFilter, setPeriodFilter] = useState<'day' | 'week' | 'month'>('day');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [profFilter, setProfFilter] = useState<string>('all');

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const currentMonthStr = format(today, 'yyyy-MM');

  const getPeriodLabel = () => {
    switch (periodFilter) {
      case 'day': return "Aujourd'hui";
      case 'week': return "Cette semaine";
      case 'month': return "Ce mois";
      default: return "";
    }
  };

  const getPeriodShortLabel = () => {
    switch (periodFilter) {
      case 'day': return "Auj.";
      case 'week': return "Sem.";
      case 'month': return "Mois";
      default: return "";
    }
  };

  // Normalise une date ISO (ex: "2026-06-02T00:00:00Z") en "yyyy-MM-dd"
  const normalizeDate = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
  };

  // --- Filtered Data ---
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const dateNorm = normalizeDate(c.date);
      if (periodFilter === 'day') return dateNorm === todayStr;
      if (periodFilter === 'week') {
        try {
          const date = parseISO(dateNorm);
          return isWithinInterval(date, { start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) });
        } catch { return false; }
      }
      if (periodFilter === 'month') return dateNorm.startsWith(currentMonthStr);
      return true;
    });
  }, [courses, periodFilter, todayStr, currentMonthStr, today]);

  const filteredAttendances = useMemo(() => {
    return attendances.filter(a => {
      const dateNorm = normalizeDate(a.date);
      if (periodFilter === 'day') return dateNorm === todayStr;
      if (periodFilter === 'week') {
        try {
          const date = parseISO(dateNorm);
          return isWithinInterval(date, { start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) });
        } catch { return false; }
      }
      if (periodFilter === 'month') return dateNorm.startsWith(currentMonthStr);
      return true;
    });
  }, [attendances, periodFilter, todayStr, currentMonthStr, today]);

  const filteredHours = filteredAttendances.reduce((acc, a) => acc + (a.calculatedHours || 0), 0);
  const filteredAbsences = filteredAttendances.filter(a => a.status === 'absent').length;

  const filteredSalaryCost = useMemo(() => {
    return professors.reduce((total, prof) => {
      const profAtts = filteredAttendances.filter(a => a.professorId === prof.id && a.status !== 'remplacement');
      const hours = profAtts.reduce((acc, a) => acc + (a.calculatedHours || 0), 0);
      return total + (hours * (prof.hourlyRate || 0));
    }, 0);
  }, [professors, filteredAttendances]);

  // --- Charts Data ---
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(today, 6 - i);
      return format(d, 'yyyy-MM-dd');
    });
  }, [today]);

  const hoursChartData = useMemo(() => {
    return last7Days.map(date => {
      const dayAtts = attendances.filter(a => a.date === date);
      const hours = dayAtts.reduce((acc, a) => acc + (a.calculatedHours || 0), 0);
      return {
        name: format(parseISO(date), 'EEE d', { locale: fr }),
        heures: hours
      };
    });
  }, [last7Days, attendances]);

  const absencesChartData = useMemo(() => {
    return last7Days.map(date => {
      const dayAtts = attendances.filter(a => a.date === date);
      const absences = dayAtts.filter(a => a.status === 'absent').length;
      return {
        name: format(parseISO(date), 'EEE d', { locale: fr }),
        absences: absences
      };
    });
  }, [last7Days, attendances]);

  // --- Activité des professeurs ---
  const profActivity = useMemo(() => {
    return professors.map(prof => {
      const profCourses = filteredCourses.filter(c => c.professorId === prof.id);
      const profAtts = filteredAttendances.filter(a => a.professorId === prof.id);
      
      const hours = profAtts.reduce((acc, a) => acc + (a.calculatedHours || 0), 0);
      const isAbsent = profAtts.some(a => a.status === 'absent');
      const isLate = profAtts.some(a => a.status === 'retard');
      
      let status = 'Aucun cours';
      let statusColor = 'text-gray-500 bg-gray-100';
      
      if (profCourses.length > 0) {
        if (isAbsent) {
          status = 'Absent';
          statusColor = 'text-red-700 bg-red-100';
        } else if (isLate) {
          status = 'En retard';
          statusColor = 'text-amber-700 bg-amber-100';
        } else if (profAtts.length > 0) {
          status = 'Présent';
          statusColor = 'text-emerald-700 bg-emerald-100';
        } else {
          status = 'En attente';
          statusColor = 'text-blue-700 bg-blue-100';
        }
      }

      return {
        prof,
        hours,
        status,
        statusColor,
        lates: profAtts.filter(a => a.status === 'retard').length
      };
    }).filter(p => p.status !== 'Aucun cours').sort((a, b) => b.hours - a.hours);
  }, [professors, filteredCourses, filteredAttendances]);

  // --- Planning ---
  const planningFiltered = useMemo(() => {
    return filteredCourses.map(course => {
      const prof = professors.find(p => p.id === course.professorId);
      const cls = classes.find(c => c.id === course.classId);
      const sub = subjects.find(s => s.id === course.subjectId);
      const attendance = filteredAttendances.find(a => a.courseId === course.id);
      
      return {
        course,
        prof,
        cls,
        sub,
        attendance
      };
    }).sort((a, b) => {
      if (a.course.date !== b.course.date) {
        return a.course.date.localeCompare(b.course.date);
      }
      return a.course.startTime.localeCompare(b.course.startTime);
    });
  }, [filteredCourses, professors, classes, subjects, filteredAttendances]);

  // --- Alertes ---
  const alerts = useMemo(() => {
    const newAlerts = [];
    
    // Professeurs absents
    const absents = filteredAttendances.filter(a => a.status === 'absent');
    absents.forEach(a => {
      const prof = professors.find(p => p.id === a.professorId);
      if (prof) {
        newAlerts.push({
          id: `absent-${a.id}`,
          type: 'danger',
          icon: XCircle,
          message: `${prof.firstName} ${prof.lastName} est absent (${format(parseISO(a.date), 'dd/MM')}).`
        });
      }
    });

    // Cours non pointés (terminés mais pas de pointage)
    const nowTime = format(today, 'HH:mm');
    const unpointedCourses = filteredCourses.filter(c => {
      const isPastDay = c.date < todayStr;
      const isFinishedToday = c.date === todayStr && c.endTime < nowTime;
      const isFinished = isPastDay || isFinishedToday;
      const hasAttendance = filteredAttendances.some(a => a.courseId === c.id);
      return isFinished && !hasAttendance;
    });
    
    unpointedCourses.forEach(c => {
      const prof = professors.find(p => p.id === c.professorId);
      const cls = classes.find(cl => cl.id === c.classId);
      if (prof && cls) {
        newAlerts.push({
          id: `unpointed-${c.id}`,
          type: 'warning',
          icon: AlertTriangle,
          message: `Cours de ${cls.name} avec ${prof.lastName} terminé mais non pointé (${format(parseISO(c.date), 'dd/MM')}).`
        });
      }
    });

    return newAlerts;
  }, [filteredAttendances, filteredCourses, professors, classes, today, todayStr]);

  // --- Finance Rapide ---
  const totalPaidMonth = payments
    .filter(p => p.month === currentMonthStr && p.status === 'paid')
    .reduce((acc, p) => acc + (p.amount || 0), 0);
  
  const remainingToPay = Math.max(0, filteredSalaryCost - totalPaidMonth);

  return (
    <div className="space-y-6 pb-10">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        
        <div className="flex items-center bg-gray-100/80 p-1 rounded-lg border border-gray-200/60 shadow-inner">
          <button 
            onClick={() => setPeriodFilter('day')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${periodFilter === 'day' ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'}`}
          >
            Aujourd'hui
          </button>
          <button 
            onClick={() => setPeriodFilter('week')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${periodFilter === 'week' ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'}`}
          >
            Semaine
          </button>
          <button 
            onClick={() => setPeriodFilter('month')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${periodFilter === 'month' ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'}`}
          >
            Mois
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-gray-500">Professeurs</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{professors.length}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-gray-500">Cours ({getPeriodShortLabel()})</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{filteredCourses.length}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-gray-500">Heures ({getPeriodShortLabel()})</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {filteredHours.toFixed(1)}h
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-gray-500">Absences ({getPeriodShortLabel()})</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{filteredAbsences}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <Banknote className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-gray-500">Coût Salarial ({getPeriodShortLabel()})</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{(filteredSalaryCost || 0).toLocaleString()} {settings?.currency || 'CFA'}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Charts & Activity */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-bold text-gray-900 mb-4">Heures effectuées (7 derniers jours)</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hoursChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHeures" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ stroke: '#e5e7eb', strokeWidth: 2 }}
                    />
                    <Area type="monotone" dataKey="heures" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorHeures)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-bold text-gray-900 mb-4">Absences (7 derniers jours)</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={absencesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: '#f3f4f6' }}
                    />
                    <Bar dataKey="absences" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Activité des professeurs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Activité des professeurs ({getPeriodLabel()})</h2>
              <Link to="/admin/professors" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                Voir tout <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Professeur</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Heures</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Statut</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Retards</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {profActivity.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-gray-500 text-sm">
                        Aucun cours prévu {getPeriodLabel().toLowerCase()}.
                      </td>
                    </tr>
                  ) : (
                    profActivity.map(({ prof, hours, status, statusColor, lates }) => (
                      <tr key={prof.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <div className="font-medium text-gray-900">{prof.firstName} {prof.lastName}</div>
                          <div className="text-xs text-gray-500">{prof.specialty}</div>
                        </td>
                        <td className="px-5 py-3 text-sm font-medium text-gray-900 text-right">
                          {hours > 0 ? `${hours.toFixed(1)}h` : '-'}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          {lates > 0 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                              {lates}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Planning, Alerts, Finance */}
        <div className="space-y-6">
          
          {/* Alertes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-red-50/50 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h2 className="text-base font-bold text-gray-900">Alertes Critiques</h2>
              {alerts.length > 0 && (
                <span className="ml-auto bg-red-100 text-red-700 py-0.5 px-2 rounded-full text-xs font-bold">
                  {alerts.length}
                </span>
              )}
            </div>
            <div className="p-2">
              {alerts.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  <p>Aucune alerte pour le moment.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map(alert => (
                    <div key={alert.id} className={`p-3 rounded-lg flex items-start gap-3 ${
                      alert.type === 'danger' ? 'bg-red-50 text-red-800 border border-red-100' : 
                      'bg-amber-50 text-amber-800 border border-amber-100'
                    }`}>
                      <alert.icon className={`w-5 h-5 shrink-0 mt-0.5 ${
                        alert.type === 'danger' ? 'text-red-600' : 'text-amber-600'
                      }`} />
                      <p className="text-sm font-medium">{alert.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Finance Rapide */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Finance (Ce mois)
              </h2>
              <Link to="/admin/payroll" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                Détails
              </Link>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Total à payer</span>
                  <span className="font-bold text-gray-900">{filteredSalaryCost.toLocaleString()} {settings?.currency || 'CFA'}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Déjà payé</span>
                  <span className="font-bold text-emerald-600">{totalPaidMonth.toLocaleString()} {settings?.currency || 'CFA'}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full" 
                    style={{ width: `${filteredSalaryCost > 0 ? (totalPaidMonth / filteredSalaryCost) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Reste à payer</span>
                  <span className="font-bold text-amber-600">{remainingToPay.toLocaleString()} {settings?.currency || 'CFA'}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-amber-500 h-2 rounded-full" 
                    style={{ width: `${filteredSalaryCost > 0 ? (remainingToPay / filteredSalaryCost) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Planning */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[400px]">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-600" />
                Planning ({getPeriodLabel()})
              </h2>
              <Link to="/admin/schedule" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                Voir tout
              </Link>
            </div>
            <div className="p-0 overflow-y-auto flex-1">
              {planningFiltered.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Aucun cours planifié {getPeriodLabel().toLowerCase()}.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {planningFiltered.map(({ course, prof, cls, sub, attendance }) => (
                    <div key={course.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">
                            {periodFilter !== 'day' && <span className="text-indigo-600 mr-2">{format(parseISO(course.date), 'dd/MM')}</span>}
                            {course.startTime} - {course.endTime}
                          </p>
                          <p className="text-xs font-medium text-indigo-600">{sub?.name} • {cls?.name}</p>
                        </div>
                        {attendance ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                            <Check className="w-3 h-3" /> Pointé
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                            En attente
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                            {prof?.firstName[0]}{prof?.lastName[0]}
                          </div>
                          <span className="text-sm text-gray-600">{prof?.firstName} {prof?.lastName}</span>
                        </div>
                        {!attendance && (
                          <Link 
                            to="/admin/attendance" 
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded"
                          >
                            Pointer
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

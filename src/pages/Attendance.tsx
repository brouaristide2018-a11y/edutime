import React, { useState, useMemo } from 'react';
import { useStore, type Attendance as AttendanceType, AttendanceStatus, Course } from '../store';
import { format, parseISO, isSameDay, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle2, Clock, XCircle, UserPlus, Search, Filter, Calendar, FileText, Download, QrCode, Printer, Trash2 } from 'lucide-react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { clsx } from 'clsx';
import jsPDF from 'jspdf';
import { ConfirmModal } from '../components/ConfirmModal';

export function Attendance() {
  const { courses, professors, classes, subjects, attendances, addAttendance, updateAttendance, deleteAttendance, currentUser, settings } = useStore();
  const [activeTab, setActiveTab] = useState<'today' | 'manual' | 'history'>('today');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [replacementCourse, setReplacementCourse] = useState<Course | null>(null);
  const [isReplacementConfirmOpen, setIsReplacementConfirmOpen] = useState(false);
  const [isReplacementProfSelectionOpen, setIsReplacementProfSelectionOpen] = useState(false);
  const [profSearchQuery, setProfSearchQuery] = useState('');
  
  // Filters for history
  const [filterProf, setFilterProf] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [isConfirmManualModalOpen, setIsConfirmManualModalOpen] = useState(false);

  // Manual Entry State
  const [manualForm, setManualForm] = useState<Partial<AttendanceType>>({
    professorId: '',
    classId: '',
    subjectId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    plannedStartTime: '08:00',
    plannedEndTime: '10:00',
    actualStartTime: '08:00',
    actualEndTime: '10:00',
    status: 'present'
  });

  // Today's courses
  const todayCourses = useMemo(() => {
    return courses.filter(c => c.date === selectedDate).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [courses, selectedDate]);

  // Today's manual attendances (without a courseId)
  const todayManualAttendances = useMemo(() => {
    return attendances.filter(a => a.date === selectedDate && !a.courseId).sort((a, b) => a.plannedStartTime.localeCompare(b.plannedStartTime));
  }, [attendances, selectedDate]);

  const getAttendanceForCourse = (courseId: string) => {
    return attendances.find(a => a.courseId === courseId);
  };

  const calculateHours = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startParts = start.split(':').map(Number);
    const endParts = end.split(':').map(Number);
    
    if (startParts.some(isNaN) || endParts.some(isNaN) || startParts.length < 2 || endParts.length < 2) {
      return 0;
    }

    const [startH, startM] = startParts;
    const [endH, endM] = endParts;
    const diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    const result = diffMinutes / 60;
    return isNaN(result) ? 0 : Math.max(0, result);
  };

  const handleMarkAttendance = (course: Course, status: AttendanceStatus, actualStart?: string, actualEnd?: string, replacementId?: string) => {
    const existing = getAttendanceForCourse(course.id);
    
    let calcHours = 0;
    if (status === 'present' || status === 'remplacement') {
      calcHours = calculateHours(actualStart || course.startTime, actualEnd || course.endTime);
    } else if (status === 'retard') {
      calcHours = calculateHours(actualStart || course.startTime, actualEnd || course.endTime);
    } // absent = 0

    const attendanceData: Omit<AttendanceType, 'id' | 'createdAt' | 'schoolId'> = {
      courseId: course.id,
      professorId: course.professorId,
      classId: course.classId,
      subjectId: course.subjectId,
      date: course.date,
      plannedStartTime: course.startTime,
      plannedEndTime: course.endTime,
      actualStartTime: actualStart || course.startTime,
      actualEndTime: actualEnd || course.endTime,
      status,
      replacementProfessorId: replacementId || null,
      calculatedHours: calcHours,
      validatedByAdmin: true
    } as any;

    if (existing) {
      updateAttendance(existing.id, attendanceData);
    } else {
      addAttendance(attendanceData);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmManualModalOpen(true);
  };

  const confirmManualAttendance = () => {
    let calcHours = 0;
    if (manualForm.status !== 'absent') {
      calcHours = calculateHours(manualForm.actualStartTime || manualForm.plannedStartTime!, manualForm.actualEndTime || manualForm.plannedEndTime!);
    }
    
    addAttendance({
      ...manualForm,
      calculatedHours: calcHours,
      validatedByAdmin: true
    } as Omit<AttendanceType, 'id' | 'createdAt' | 'schoolId'>);
    
    setManualForm({
      professorId: '',
      classId: '',
      subjectId: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      plannedStartTime: '08:00',
      plannedEndTime: '10:00',
      actualStartTime: '08:00',
      actualEndTime: '10:00',
      status: 'present'
    });
    // Removed alert as per request (modal is the confirmation)
  };

  const filteredHistory = useMemo(() => {
    return attendances.filter(a => {
      if (filterProf && a.professorId !== filterProf && a.replacementProfessorId !== filterProf) return false;
      if (filterClass && a.classId !== filterClass) return false;
      if (filterStatus && a.status !== filterStatus) return false;
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendances, filterProf, filterClass, filterStatus]);

  const StatusBadge = ({ status, scannedAt, validatedByAdmin }: { status: AttendanceStatus, scannedAt?: string, validatedByAdmin?: boolean }) => {
    const styles = {
      present: 'bg-green-100 text-green-800 border-green-200',
      retard: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      absent: 'bg-red-100 text-red-800 border-red-200',
      remplacement: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    
    const labels = {
      present: 'Présent',
      retard: 'Retard',
      absent: 'Absent',
      remplacement: 'Remplacé'
    };

    return (
      <div className="flex flex-col items-start gap-1">
        <div className="flex items-center gap-2">
          <span className={clsx('px-2.5 py-1 rounded-full text-xs font-medium border', styles[status])}>
            {labels[status]}
          </span>
          {validatedByAdmin && (
            <span className="flex items-center gap-1 text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter shadow-sm">
              <CheckCircle2 className="w-3 h-3" />
              Approuvé
            </span>
          )}
          {!validatedByAdmin && status !== 'absent' && (
            <span className="flex items-center gap-1 text-[9px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter shadow-sm">
              En attente d'approbation
            </span>
          )}
        </div>
        <div className="mt-0.5">
          {scannedAt ? (
            <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 font-medium">
              <QrCode className="w-3 h-3" />
              QR Code • {format(parseISO(scannedAt.replace(' ', 'T')), "HH:mm")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200 font-medium">
              <FileText className="w-3 h-3" />
              Manuel
            </span>
          )}
        </div>
      </div>
    );
  };

  const handleDownloadPDF = async () => {
    const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    try {
      const imgData = canvas.toDataURL('image/png');
      
      // A4 size: 210 x 297 mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate image dimensions to fit A4 width with some margin
      const margin = 20;
      const imgWidth = pdfWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add title
      pdf.setFontSize(24);
      pdf.setTextColor(0, 0, 0);
      pdf.text('QR Code de Présence', pdfWidth / 2, 40, { align: 'center' });
      
      // Add date
      pdf.setFontSize(14);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Année scolaire : ${settings?.schoolYear || '2023-2024'}`, pdfWidth / 2, 55, { align: 'center' });

      // Add QR Code image centered
      const yPos = 80;
      pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
      
      // Add instruction text at the bottom
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Scannez ce code depuis la page principale pour', pdfWidth / 2, yPos + imgHeight + 30, { align: 'center' });
      pdf.text('marquer votre présence en classe.', pdfWidth / 2, yPos + imgHeight + 38, { align: 'center' });

      pdf.save(`QR_Presence_Annuel_${settings?.schoolYear || '2023-2024'}.pdf`);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Une erreur est survenue lors de la génération du PDF.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pointage & Présences</h1>
        <button
          onClick={() => setShowQRModal(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <QrCode className="w-5 h-5 mr-2" />
          Générer QR Code
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('today')}
          className={clsx(
            'px-4 py-2 text-sm font-medium rounded-md transition-colors',
            activeTab === 'today' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          )}
        >
          Pointage du jour
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={clsx(
            'px-4 py-2 text-sm font-medium rounded-md transition-colors',
            activeTab === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          )}
        >
          Pointage manuel
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={clsx(
            'px-4 py-2 text-sm font-medium rounded-md transition-colors',
            activeTab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          )}
        >
          Historique
        </button>
      </div>

      {/* Tab: Today */}
      {activeTab === 'today' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-none bg-transparent focus:ring-0 text-gray-900 font-medium"
            />
            <span className="text-gray-500 text-sm">
              {format(parseISO(selectedDate), 'EEEE d MMMM yyyy', { locale: fr })}
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">Heure</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">Professeur</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">Classe</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">Matière</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">Statut</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {todayCourses.map(course => {
                    const prof = professors.find(p => p.id === course.professorId);
                    const cls = classes.find(c => c.id === course.classId);
                    const sub = subjects.find(s => s.id === course.subjectId);
                    const attendance = getAttendanceForCourse(course.id);

                    return (
                      <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {course.startTime} - {course.endTime}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <div>{prof ? `${prof.firstName} ${prof.lastName}` : 'Inconnu'}</div>
                          {attendance?.status === 'remplacement' && attendance.replacementProfessorId && (
                            <div className="text-[10px] text-blue-600 font-normal mt-1 flex items-center gap-1">
                              <UserPlus className="w-3 h-3" />
                              Remplacé par: {(() => {
                                const rep = professors.find(p => p.id === attendance.replacementProfessorId);
                                return rep ? `${rep.firstName} ${rep.lastName}` : 'Inconnu';
                              })()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {cls?.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {sub?.name}
                        </td>
                        <td className="px-6 py-4">
                          {attendance ? (
                            <StatusBadge 
                              status={attendance.status} 
                              scannedAt={attendance.scannedAt} 
                              validatedByAdmin={attendance.validatedByAdmin}
                            />
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                              En attente
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {!attendance?.validatedByAdmin ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleMarkAttendance(course, 'present')}
                                className={clsx(
                                  "p-1.5 rounded-lg transition-colors border shadow-sm flex items-center gap-1.5",
                                  attendance?.status === 'present' ? "bg-green-600 text-white border-green-700" : "bg-white text-green-600 border-green-200 hover:bg-green-50"
                                )}
                                title={attendance?.status === 'present' ? "Approuver la présence" : "Marquer comme présent & approuver"}
                              >
                                <CheckCircle2 className="w-5 h-5" />
                                {attendance?.status === 'present' && <span className="text-[10px] font-bold uppercase text-white">Approuver</span>}
                              </button>
                              <button
                                onClick={() => {
                                  const actualStart = window.prompt('Heure d\'arrivée réelle (HH:mm) :', course.startTime);
                                  if (actualStart) {
                                    handleMarkAttendance(course, 'retard', actualStart);
                                  }
                                }}
                                className={clsx(
                                  "p-1.5 rounded-lg transition-colors border shadow-sm",
                                  attendance?.status === 'retard' ? "bg-yellow-100 text-yellow-700 border-yellow-200" : "bg-white text-gray-400 border-gray-200 hover:text-yellow-600 hover:bg-yellow-50"
                                )}
                                title="Retard"
                              >
                                <Clock className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleMarkAttendance(course, 'absent')}
                                className={clsx(
                                  "p-1.5 rounded-lg transition-colors border shadow-sm",
                                  attendance?.status === 'absent' ? "bg-red-100 text-red-700" : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                                )}
                                title="Absent"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setReplacementCourse(course);
                                  setIsReplacementConfirmOpen(true);
                                }}
                                className={clsx(
                                  "p-1.5 rounded-lg transition-colors border shadow-sm",
                                  attendance?.status === 'remplacement' ? "bg-blue-100 text-blue-700" : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                )}
                                title="Remplacé"
                              >
                                <UserPlus className="w-5 h-5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end text-xs font-semibold text-emerald-600 italic bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 w-fit ml-auto">
                              <CheckCircle2 className="w-4 h-4 mr-1.5" />
                              Validé par l'administration
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {todayManualAttendances.map(attendance => {
                    const prof = professors.find(p => p.id === attendance.professorId);
                    const cls = classes.find(c => c.id === attendance.classId);
                    const sub = subjects.find(s => s.id === attendance.subjectId);

                    return (
                      <tr key={`manual-${attendance.id}`} className="hover:bg-gray-50 transition-colors bg-blue-50/30">
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {attendance.plannedStartTime} - {attendance.plannedEndTime}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 flex items-center gap-2">
                          {prof ? `${prof.firstName} ${prof.lastName}` : 'Inconnu'}
                          <span className="text-[10px] text-blue-600 font-medium bg-blue-100 px-2 py-0.5 rounded-full whitespace-nowrap">Manuel</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {cls?.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {sub?.name}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge 
                            status={attendance.status} 
                            scannedAt={attendance.scannedAt} 
                            validatedByAdmin={attendance.validatedByAdmin}
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                if (window.confirm('Voulez-vous supprimer ce pointage manuel ?')) {
                                  deleteAttendance(attendance.id);
                                }
                              }}
                              className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-red-600 hover:bg-red-50"
                              title="Supprimer le pointage manuel"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {(todayCourses.length === 0 && todayManualAttendances.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        Aucun pointage ou cours pour cette date.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Manual */}
      {activeTab === 'manual' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Saisir un pointage manuel</h2>
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Professeur *</label>
                <select
                  required
                  value={manualForm.professorId || ''}
                  onChange={(e) => setManualForm({ ...manualForm, professorId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Sélectionner</option>
                  {professors.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Classe *</label>
                <select
                  required
                  value={manualForm.classId || ''}
                  onChange={(e) => setManualForm({ ...manualForm, classId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Sélectionner</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matière *</label>
                <select
                  required
                  value={manualForm.subjectId || ''}
                  onChange={(e) => setManualForm({ ...manualForm, subjectId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Sélectionner</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={manualForm.date}
                  onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heure de début prévue *</label>
                <input
                  type="time"
                  required
                  value={manualForm.plannedStartTime || ''}
                  onChange={(e) => setManualForm({ ...manualForm, plannedStartTime: e.target.value, actualStartTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heure de fin prévue *</label>
                <input
                  type="time"
                  required
                  value={manualForm.plannedEndTime || ''}
                  onChange={(e) => setManualForm({ ...manualForm, plannedEndTime: e.target.value, actualEndTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut *</label>
              <select
                required
                value={manualForm.status}
                onChange={(e) => setManualForm({ ...manualForm, status: e.target.value as AttendanceStatus })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="present">Présent</option>
                <option value="retard">Retard</option>
                <option value="absent">Absent</option>
                <option value="remplacement">Remplacé</option>
              </select>
            </div>

            {(manualForm.status === 'retard' || manualForm.status === 'present' || manualForm.status === 'remplacement') && (
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure d'arrivée réelle</label>
                  <input
                    type="time"
                    value={manualForm.actualStartTime || ''}
                    onChange={(e) => setManualForm({ ...manualForm, actualStartTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure de départ réelle</label>
                  <input
                    type="time"
                    value={manualForm.actualEndTime || ''}
                    onChange={(e) => setManualForm({ ...manualForm, actualEndTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {manualForm.status === 'remplacement' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Professeur remplaçant *</label>
                <select
                  required
                  value={manualForm.replacementProfessorId || ''}
                  onChange={(e) => setManualForm({ ...manualForm, replacementProfessorId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Sélectionner</option>
                  {professors.filter(p => p.id !== manualForm.professorId).map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Enregistrer le pointage
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filtres :</span>
            </div>
            <select
              value={filterProf}
              onChange={(e) => setFilterProf(e.target.value)}
              className="text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Tous les professeurs</option>
              {professors.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Toutes les classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Tous les statuts</option>
              <option value="present">Présent</option>
              <option value="retard">Retard</option>
              <option value="absent">Absent</option>
              <option value="remplacement">Remplacé</option>
            </select>
            <div className="flex-1"></div>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              Exporter
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">Professeur</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">Classe / Matière</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">Horaires</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">Statut</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Heures comptées</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        Aucun historique trouvé.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map(attendance => {
                      const prof = professors.find(p => p.id === attendance.professorId);
                      const repProf = professors.find(p => p.id === attendance.replacementProfessorId);
                      const cls = classes.find(c => c.id === attendance.classId);
                      const sub = subjects.find(s => s.id === attendance.subjectId);

                      return (
                        <tr key={attendance.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                            {format(parseISO(attendance.date), 'dd/MM/yyyy')}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="font-medium text-gray-900">
                              {prof ? `${prof.firstName} ${prof.lastName}` : 'Inconnu'}
                            </div>
                            {attendance.status === 'remplacement' && repProf && (
                              <div className="text-xs text-blue-600 mt-0.5">
                                Remplacé par: {repProf.firstName} {repProf.lastName}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div className="font-medium text-gray-900">{cls?.name}</div>
                            <div className="text-xs text-gray-500">{sub?.name}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div>Prévu: {attendance.plannedStartTime} - {attendance.plannedEndTime}</div>
                            {(attendance.status === 'retard' || attendance.status === 'present') && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                Réel: {attendance.actualStartTime} - {attendance.actualEndTime}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge 
                              status={attendance.status} 
                              scannedAt={attendance.scannedAt} 
                              validatedByAdmin={attendance.validatedByAdmin}
                            />
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                            {attendance.calculatedHours.toFixed(2)} h
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl max-w-sm w-full text-center shadow-xl">
            <h3 className="text-xl font-bold mb-2 text-gray-900">QR Code de Pointage</h3>
            <p className="text-gray-500 mb-6">Année scolaire : {settings?.schoolYear || '2023-2024'}</p>
            <div id="qr-code-container" className="flex justify-center mb-8 p-4 bg-white border-2 border-dashed border-gray-200 rounded-xl">
              <QRCodeCanvas 
                id="qr-code-canvas"
                value={JSON.stringify({ type: 'attendance', schoolId: currentUser?.schoolId, schoolYear: settings?.schoolYear || '2023-2024' })} 
                size={250} 
                level="H"
              />
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Les professeurs peuvent scanner ce code unique tout au long de l'année scolaire pour enregistrer leur présence.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDownloadPDF}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors w-full"
              >
                <Download className="w-5 h-5" />
                Télécharger (PDF)
              </button>
              <button 
                onClick={() => setShowQRModal(false)} 
                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 w-full transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmManualModalOpen}
        onClose={() => setIsConfirmManualModalOpen(false)}
        onConfirm={confirmManualAttendance}
        title="Confirmer le pointage manuel"
        message="Êtes-vous sûr de vouloir enregistrer ce pointage manuel ? Cette action sera prise en compte immédiatement dans le système."
        confirmText="Confirmer l'enregistrement"
        cancelText="Annuler"
        isDanger={false}
      />

      {/* Replacement Workflow Modals */}
      <ConfirmModal
        isOpen={isReplacementConfirmOpen}
        onClose={() => {
          setIsReplacementConfirmOpen(false);
          setReplacementCourse(null);
        }}
        onConfirm={() => {
          setIsReplacementConfirmOpen(false);
          setIsReplacementProfSelectionOpen(true);
        }}
        title="Confirmer le remplacement"
        message="Souhaitez-vous marquer ce cours comme étant assuré par un remplaçant ?"
        confirmText="Confirmer & Choisir le remplaçant"
        cancelText="Annuler"
        isDanger={false}
      />

      {isReplacementProfSelectionOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Choisir le remplaçant</h3>
              <button 
                onClick={() => {
                  setIsReplacementProfSelectionOpen(false);
                  setReplacementCourse(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Chercher un professeur..."
                  value={profSearchQuery}
                  onChange={(e) => setProfSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-2">
              <div className="grid gap-1">
                {professors
                  .filter(p => p.id !== replacementCourse?.professorId) // Exclude original prof
                  .filter(p => !profSearchQuery || `${p.firstName} ${p.lastName}`.toLowerCase().includes(profSearchQuery.toLowerCase()))
                  .map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        if (replacementCourse) {
                          handleMarkAttendance(replacementCourse, 'remplacement', replacementCourse.startTime, replacementCourse.endTime, p.id);
                        }
                        setIsReplacementProfSelectionOpen(false);
                        setReplacementCourse(null);
                        setProfSearchQuery('');
                      }}
                      className="flex items-center gap-3 p-3 text-left rounded-lg hover:bg-indigo-50 transition-colors group border border-transparent hover:border-indigo-200"
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                        {p.firstName[0]}{p.lastName[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 group-hover:text-indigo-700">{p.firstName} {p.lastName}</p>
                        <p className="text-xs text-gray-500">{p.specialty}</p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
              </div>
              
              {professors.length === 0 && (
                <div className="p-8 text-center text-gray-500 italic">
                  Aucun autre professeur disponible.
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => {
                  setIsReplacementProfSelectionOpen(false);
                  setReplacementCourse(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

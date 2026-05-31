import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Clock, MapPin, CheckCircle2, AlertCircle, Calendar, QrCode, X, FileText } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Html5Qrcode } from 'html5-qrcode';

const QRScannerModal = ({ onScan, onClose }: { onScan: (data: string) => void, onClose: () => void }) => {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = React.useRef<Html5Qrcode | null>(null);
  const isTransitioningRef = React.useRef<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;
      
      try {
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode("qr-reader");
        }
        
        const html5QrCode = scannerRef.current;
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        };

        try {
          await html5QrCode.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
              if (isMounted && html5QrCode.isScanning && !isTransitioningRef.current) {
                isTransitioningRef.current = true;
                html5QrCode.stop().then(() => {
                  isTransitioningRef.current = false;
                  onScan(decodedText);
                }).catch((err) => {
                  isTransitioningRef.current = false;
                  console.error(err);
                });
              }
            },
            () => {}
          );
        } catch (startErr) {
          // Fallback
          await html5QrCode.start(
            { facingMode: "user" },
            config,
            (decodedText) => {
              if (isMounted && html5QrCode.isScanning && !isTransitioningRef.current) {
                isTransitioningRef.current = true;
                html5QrCode.stop().then(() => {
                  isTransitioningRef.current = false;
                  onScan(decodedText);
                }).catch((err) => {
                  isTransitioningRef.current = false;
                  console.error(err);
                });
              }
            },
            () => {}
          );
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Erreur d'initialisation de la caméra:", err);
        if (err instanceof Error && (err.name === 'NotAllowedError' || err.message.includes('Permission denied'))) {
          setError("L'accès à la caméra a été refusé. Veuillez l'autoriser.");
        } else {
          setError("Impossible d'accéder à la caméra.");
        }
      } finally {
        isTransitioningRef.current = false;
      }
    };

    startScanner();
    
    return () => {
      isMounted = false;
      if (scannerRef.current?.isScanning && !isTransitioningRef.current) {
        isTransitioningRef.current = true;
        scannerRef.current.stop()
          .then(() => { isTransitioningRef.current = false; })
          .catch((err) => {
            isTransitioningRef.current = false;
            console.error(err);
          });
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Scanner le QR Code</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Erreur de caméra</p>
                <p>{error}</p>
                <p className="mt-2 text-xs opacity-80">
                  Note : Si vous utilisez un iPhone/iPad, assurez-vous d'avoir autorisé l'accès à la caméra pour ce site.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div id="qr-reader" className="w-full mb-4 overflow-hidden rounded-lg bg-black min-h-[250px]"></div>
        )}

        <button 
          onClick={onClose} 
          className="w-full px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
        >
          {error ? "Fermer" : "Annuler"}
        </button>
      </div>
    </div>
  );
};

export function ProfAttendance() {
  const currentUser = useStore(state => state.currentUser);
  const professors = useStore(state => state.professors);
  const courses = useStore(state => state.courses);
  const classes = useStore(state => state.classes);
  const subjects = useStore(state => state.subjects);
  const rooms = useStore(state => state.rooms);
  const attendances = useStore(state => state.attendances);
  const addAttendance = useStore(state => state.addAttendance);
  const professorRequests = useStore(state => state.professorRequests);
  const settings = useStore(state => state.settings);
  
  const [isPointing, setIsPointing] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState('');

  const professor = professors.find(p => p.userId === currentUser?.id);

  if (!professor) {
    return <div>Profil professeur introuvable.</div>;
  }

  // Get today's courses
  const todayCourses = courses.filter(c => 
    c.professorId === professor.id && 
    isToday(parseISO(c.date))
  ).sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Get past attendances (include where professor was replaced OR was the replacement)
  const pastAttendances = attendances
    .filter(a => a.professorId === professor.id || a.replacementProfessorId === professor.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleScan = React.useCallback((data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'attendance' && parsed.date === format(new Date(), 'yyyy-MM-dd')) {
        
        // --- Vérification supplémentaire stricte pour Abonnement Suspendu lors du scan QR
        // En réalité cela est censé être géré au niveau Layout ou Login, 
        // mais pour se plier strictement au cahier des charges : 
        if (settings?.subscription?.status === 'Suspendu') {
            setScanError("Le compte de votre administrateur a été suspendu suite à un non-paiement. Veuillez lui demander de payer l'abonnement en cours pour réactiver le scan de présence !");
            setIsPointing(false);
            setShowScanner(false);
            return;
        }

        const now = new Date();
        const currentTime = format(now, 'HH:mm');
        const scannedAt = format(now, 'yyyy-MM-dd HH:mm:ss');
        
        // Find the course that is currently happening or about to start (within 30 mins)
        const currentCourse = todayCourses.find(course => {
          const startTime = course.startTime;
          const endTime = course.endTime;
          // Consider a course active if current time is between 30 mins before start and the end time
          const [startH, startM] = startTime.split(':').map(Number);
          const courseStartMins = startH * 60 + startM;
          
          const [currH, currM] = currentTime.split(':').map(Number);
          const currentMins = currH * 60 + currM;
          
          const [endH, endM] = endTime.split(':').map(Number);
          const courseEndMins = endH * 60 + endM;

          return currentMins >= (courseStartMins - 30) && currentMins <= courseEndMins;
        });

        if (currentCourse) {
          const existing = attendances.find(a => a.courseId === currentCourse.id);
          
          if (!existing) {
            const scheduledHours = parseInt(currentCourse.endTime) - parseInt(currentCourse.startTime);
            
            // Determine status based on time
            // If scanning more than 15 mins after start time, mark as retard
            const [startH, startM] = currentCourse.startTime.split(':').map(Number);
            const courseStartMins = startH * 60 + startM;
            const [currH, currM] = currentTime.split(':').map(Number);
            const currentMins = currH * 60 + currM;
            
            let status: 'present' | 'retard' = (currentMins - courseStartMins) > 15 ? 'retard' : 'present';

            // Check for approved retard request
            if (status === 'retard') {
              const hasApprovedRetard = professorRequests.some(req => 
                req.professorId === professor.id && 
                req.type === 'retard' && 
                req.status === 'approuvé' && 
                req.date === currentCourse.date
              );
              if (hasApprovedRetard) {
                status = 'present';
              }
            }

            addAttendance({
              professorId: professor.id,
              courseId: currentCourse.id,
              classId: currentCourse.classId,
              subjectId: currentCourse.subjectId,
              date: currentCourse.date,
              plannedStartTime: currentCourse.startTime,
              plannedEndTime: currentCourse.endTime,
              actualStartTime: currentTime,
              actualEndTime: currentCourse.endTime,
              status: status,
              calculatedHours: scheduledHours,
              scannedAt,
              validatedByAdmin: false
            });
            setShowScanner(false);
            alert(`Présence marquée avec succès pour le cours de ${currentCourse.startTime} !`);
          } else {
            setScanError('Présence déjà marquée pour ce cours.');
          }
        } else {
           // If no specific course is active, mark all unmarked courses for today as present (fallback)
           let markedCount = 0;
           todayCourses.forEach(course => {
             const existing = attendances.find(a => a.courseId === course.id);
             if (!existing) {
               const scheduledHours = parseInt(course.endTime) - parseInt(course.startTime);
               addAttendance({
                 professorId: professor.id,
                 courseId: course.id,
                 classId: course.classId,
                 subjectId: course.subjectId,
                 date: course.date,
                 plannedStartTime: course.startTime,
                 plannedEndTime: course.endTime,
                 actualStartTime: course.startTime,
                 actualEndTime: course.endTime,
                 status: 'present',
                 calculatedHours: scheduledHours,
                 scannedAt
               });
               markedCount++;
             }
           });
           
           if (markedCount > 0) {
             setShowScanner(false);
             alert(`${markedCount} présence(s) marquée(s) avec succès !`);
           } else {
             setScanError('Aucun cours trouvé à cette heure ou présences déjà marquées.');
           }
        }
      } else {
        setScanError('QR Code invalide ou expiré.');
      }
    } catch (e) {
      setScanError('QR Code non reconnu.');
    }
  }, [todayCourses, attendances, addAttendance, professor.id]);

  const handlePointage = (courseId: string) => {
    setIsPointing(true);
    
    // Simulate API call and geolocation
    setTimeout(() => {
      const course = courses.find(c => c.id === courseId);
      if (course) {
        const scheduledHours = parseInt(course.endTime) - parseInt(course.startTime);
        
        addAttendance({
          professorId: professor.id,
          courseId: course.id,
          classId: course.classId,
          subjectId: course.subjectId,
          date: course.date,
          plannedStartTime: course.startTime,
          plannedEndTime: course.endTime,
          actualStartTime: course.startTime,
          actualEndTime: course.endTime,
          status: 'present',
          calculatedHours: scheduledHours,
          validatedByAdmin: false
        });
      }
      setIsPointing(false);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Pointage & Heures</h2>
            <p className="text-gray-500 mt-1">Gérez vos présences et suivez vos heures effectuées</p>
          </div>
          <button
            onClick={() => {
              setScanError('');
              setShowScanner(true);
            }}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <QrCode className="w-5 h-5 mr-2" />
            Scanner Présence
          </button>
        </div>
      </div>

      {/* Pointage Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Pointage du jour</h3>
          </div>
        </div>
        
        <div className="p-6">
          {todayCourses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>Aucun cours prévu aujourd'hui.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayCourses.map(course => {
                const cls = classes.find(c => c.id === course.classId);
                const subject = subjects.find(s => s.id === course.subjectId);
                const room = rooms.find(r => r.id === course.roomId);
                const attendance = attendances.find(a => a.courseId === course.id);

                return (
                  <div key={course.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 text-center">
                        <div className="text-lg font-bold text-gray-900">{course.startTime}</div>
                        <div className="text-xs text-gray-500">{course.endTime}</div>
                      </div>
                      <div className="w-px h-10 bg-gray-200 hidden sm:block"></div>
                      <div>
                        <h4 className="font-medium text-gray-900">{subject?.name}</h4>
                        <p className="text-sm text-gray-500">{cls?.name} • {room?.name}</p>
                      </div>
                    </div>
                    
                    <div className="w-full sm:w-auto">
                      {attendance ? (
                        <div className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium w-full sm:w-auto ${
                          attendance.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                          attendance.status === 'retard' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          <CheckCircle2 className="w-5 h-5" />
                          <div className="flex flex-col items-start">
                            <span>{attendance.status}</span>
                            {attendance.scannedAt ? (
                              <span className="flex items-center gap-1 text-[10px] mt-0.5 opacity-90 font-medium">
                                <QrCode className="w-3 h-3" />
                                {format(parseISO(attendance.scannedAt.replace(' ', 'T')), "HH:mm")}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] mt-0.5 opacity-90 font-medium">
                                <FileText className="w-3 h-3" />
                                Manuel
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handlePointage(course.id)}
                          disabled={isPointing}
                          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                          {isPointing ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Localisation...
                            </>
                          ) : (
                            <>
                              <MapPin className="w-5 h-5" />
                              Je pointe
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Historique des heures */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Historique des heures</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Total : {pastAttendances.reduce((acc, a) => acc + a.calculatedHours, 0)}h</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Cours</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Heures prévues</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Heures effectuées</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pastAttendances.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Aucun historique de pointage.
                  </td>
                </tr>
              ) : (
                pastAttendances.map((attendance) => {
                  const course = courses.find(c => c.id === attendance.courseId);
                  const subject = subjects.find(s => s.id === course?.subjectId);
                  const cls = classes.find(c => c.id === course?.classId);

                  return (
                    <tr key={attendance.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {format(parseISO(attendance.date), 'dd MMM yyyy', { locale: fr })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">{subject?.name}</div>
                          <div className="text-xs text-gray-500">{cls?.name}</div>
                          {attendance.status === 'remplacement' && (
                            <div className="text-[10px] mt-1 font-medium italic">
                              {attendance.professorId === professor.id ? (
                                <span className="text-red-500">Remplacé par: {(() => {
                                  const rep = professors.find(p => p.id === attendance.replacementProfessorId);
                                  return rep ? `${rep.firstName} ${rep.lastName}` : 'Inconnu';
                                })()}</span>
                              ) : (
                                <span className="text-blue-600">Fait en remplacement de: {(() => {
                                  const orig = professors.find(p => p.id === attendance.professorId);
                                  return orig ? `${orig.firstName} ${orig.lastName}` : 'Inconnu';
                                })()}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {parseInt(attendance.plannedEndTime) - parseInt(attendance.plannedStartTime)}h
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {attendance.calculatedHours}h
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              attendance.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                              attendance.status === 'retard' ? 'bg-amber-100 text-amber-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {attendance.status}
                            </span>
                            {attendance.validatedByAdmin && (
                              <span className="flex items-center gap-1 text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter shadow-sm">
                                <CheckCircle2 className="w-3 h-3" />
                                Validé
                              </span>
                            )}
                          </div>
                          {attendance.scannedAt ? (
                            <span className="inline-flex items-center gap-1 w-fit mt-1 text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 font-medium">
                              <QrCode className="w-3 h-3" />
                              QR Code • {format(parseISO(attendance.scannedAt.replace(' ', 'T')), "HH:mm")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 w-fit mt-1 text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200 font-medium">
                              <FileText className="w-3 h-3" />
                              Manuel
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showScanner && (
        <QRScannerModal 
          onScan={handleScan} 
          onClose={() => setShowScanner(false)} 
        />
      )}
    </div>
  );
}

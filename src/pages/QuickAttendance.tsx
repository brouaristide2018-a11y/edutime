import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  QrCode, 
  User as UserIcon, 
  ArrowRight, 
  Camera, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Clock,
  ArrowLeft,
  Loader2,
  Calendar,
  BookOpen,
  MapPin,
  Check,
  Users
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { format, isToday, parseISO } from 'date-fns';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useStore } from '../store';
import { clsx } from 'clsx';

const QRScanner = ({ onScan, onClose }: { onScan: (data: string) => void, onClose: () => void }) => {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = React.useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      try {
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode("qr-reader-quick");
        }
        
        const html5QrCode = scannerRef.current;
        
        // Start with environment facing mode directly for better mobile support
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        
        try {
          await html5QrCode.start(
            { facingMode: "environment" },
            config,
            (text) => {
              if (isMounted) {
                html5QrCode.stop().then(() => onScan(text)).catch(console.error);
              }
            },
            () => {} // silent error for frames without QR
          );
        } catch (startErr) {
          // Fallback to any available camera if environment fails
          console.warn("Environment camera failed, trying any camera", startErr);
          await html5QrCode.start(
            { facingMode: "user" },
            config,
            (text) => {
              if (isMounted) {
                html5QrCode.stop().then(() => onScan(text)).catch(console.error);
              }
            },
            () => {}
          );
        }
      } catch (err) {
        if (isMounted) {
          console.error("Camera start error:", err);
          setError("Erreur d'accès à la caméra. Veuillez vérifier les permissions.");
        }
      }
    };

    startScanner();
    return () => {
      isMounted = false;
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop();
      }
    };
  }, [onScan]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Scanner le QR Code</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
          <X className="w-5 h-5" />
        </button>
      </div>
      {error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      ) : (
        <div id="qr-reader-quick" className="w-full aspect-square bg-black rounded-xl overflow-hidden"></div>
      )}
      <p className="text-sm text-gray-500 text-center italic">Positionnez le QR Code devant la caméra</p>
    </div>
  );
};

export function QuickAttendance() {
  const navigate = useNavigate();
  const professors = useStore(state => state.professors);
  const users = useStore(state => state.users);
  const courses = useStore(state => state.courses);
  const attendances = useStore(state => state.attendances);
  const addAttendance = useStore(state => state.addAttendance);

  const [step, setStep] = useState<'id' | 'scan' | 'confirm' | 'success'>('id');
  const [loginId, setLoginId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [matchedProfessor, setMatchedProfessor] = useState<any>(null);
  const [matchedUser, setMatchedUser] = useState<any>(null);
  const [matchedCourse, setMatchedCourse] = useState<any>(null);
  const [schoolSettings, setSchoolSettings] = useState<any>(null);
  const [lastScanStatus, setLastScanStatus] = useState<'present' | 'retard' | null>(null);
  const [scannedTimeInfo, setScannedTimeInfo] = useState<any>(null);

  useEffect(() => {
    if (step === 'success') {
      const timer = setTimeout(() => {
        navigate('/'); // Sort complètement (retour à l'accueil)
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step, navigate]);

  const handleVerifyId = async () => {
    if (!loginId.trim()) return;
    
    setError('');
    setIsLoading(true);
    
    try {
      // 1. Direct query to Firestore to find user by loginId
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('loginId', '==', loginId.trim()), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("ID de connexion non reconnu.");
        setIsLoading(false);
        return;
      }

      const userData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as any;
      setMatchedUser(userData);

      if (!userData.email) {
        setError("Cet ID n'est associé à aucune adresse mail.");
        setIsLoading(false);
        return;
      }

      // 2. Find professor linked to this user
      const professorsRef = collection(db, 'professors');
      const pq = query(professorsRef, where('userId', '==', userData.id), limit(1));
      const pSnapshot = await getDocs(pq);

      if (pSnapshot.empty) {
        setError("Profil professeur introuvable.");
        setIsLoading(false);
        return;
      }

      const profData = { id: pSnapshot.docs[0].id, ...pSnapshot.docs[0].data() } as any;
      setMatchedProfessor(profData);
      
      // 3. Fetch school settings for tolerance
      if (userData.schoolId) {
        const settingsDoc = await getDoc(doc(db, 'settings', userData.schoolId));
        if (settingsDoc.exists()) {
          setSchoolSettings(settingsDoc.data());
        }
      }

      setStep('scan');
    } catch (err) {
      console.error("Verification error:", err);
      setError("Une erreur est survenue lors de la vérification.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = useCallback(async (data: string) => {
    setIsScanning(true);
    setError('');
    
    // Simulate processing scan
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      let parsed;
      try {
        parsed = JSON.parse(data);
      } catch (e) {
        throw new Error("Le format du QR Code est invalide. Assurez-vous d'utiliser le code généré par l'administration.");
      }

      const today = format(new Date(), 'yyyy-MM-dd');
      
      if (parsed.type !== 'attendance') {
        throw new Error("Ce n'est pas un QR Code de pointage autorisé.");
      }

      const expectedSchoolYear = schoolSettings?.schoolYear || '2023-2024';
      if (parsed.schoolYear && parsed.schoolYear !== expectedSchoolYear) {
        throw new Error(`Ce QR Code est configuré pour l'année scolaire ${parsed.schoolYear}, mais l'établissement est sur l'année ${expectedSchoolYear}.`);
      }

      const now = new Date();
      const currentTime = format(now, 'HH:mm');
      
      // Fetch today's courses
      const coursesRef = collection(db, 'courses');
      const cq = query(
        coursesRef, 
        where('professorId', '==', matchedProfessor.id), 
        where('date', '==', today)
      );
      
      const cSnapshot = await getDocs(cq);
      const todayProfCourses = cSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      if (todayProfCourses.length === 0) {
        throw new Error("Vous n'avez aucun cours programmé ce jour. Le pointage est donc impossible.");
      }

      // Find identifying course
      const currentCourse = todayProfCourses.find(course => {
        const [startH, startM] = course.startTime.split(':').map(Number);
        const courseStartMins = startH * 60 + startM;
        const [currH, currM] = currentTime.split(':').map(Number);
        const currentMins = currH * 60 + currM;
        const [endH, endM] = course.endTime.split(':').map(Number);
        const courseEndMins = endH * 60 + endM;

        // Tolerance: from 90 mins before start until the end
        return currentMins >= (courseStartMins - 90) && currentMins <= courseEndMins;
      });

      if (currentCourse) {
        const attendancesRef = collection(db, 'attendances');
        const aq = query(attendancesRef, where('courseId', '==', currentCourse.id), limit(1));
        const aSnapshot = await getDocs(aq);
        
        if (!aSnapshot.empty) {
           throw new Error("Votre présence pour ce cours (" + currentCourse.startTime + ") a déjà été enregistrée.");
        }

        const [startH, startM] = currentCourse.startTime.split(':').map(Number);
        const courseStartMins = startH * 60 + startM;
        const [currH, currM] = currentTime.split(':').map(Number);
        const currentMins = currH * 60 + currM;
        
        const tolerance = schoolSettings?.toleranceTime ?? 15;
        let status: 'present' | 'retard' = (currentMins - courseStartMins) > tolerance ? 'retard' : 'present';

        // Fetch Class and Subject details for the confirmation form
        const [classDoc, subjectDoc] = await Promise.all([
          getDoc(doc(db, 'classes', currentCourse.classId)),
          getDoc(doc(db, 'subjects', currentCourse.subjectId))
        ]);

        const courseWithDetails = {
          ...currentCourse,
          className: classDoc.exists() ? classDoc.data().name : 'Classe inconnue',
          subjectName: subjectDoc.exists() ? subjectDoc.data().name : 'Matière inconnue'
        };

        setMatchedCourse(courseWithDetails);
        setLastScanStatus(status);
        setScannedTimeInfo({
          date: format(now, 'dd-MM-yyyy'),
          time: currentTime,
          fullTimestamp: format(now, 'yyyy-MM-dd HH:mm:ss')
        });
        
        setStep('confirm');
      } else {
        const sortedCourses = todayProfCourses.sort((a, b) => a.startTime.localeCompare(b.startTime));
        const nextCourse = sortedCourses.find(c => c.startTime > currentTime);
        
        if (nextCourse) {
          throw new Error(`Il est trop tôt pour pointer. Votre prochain cours commence à ${nextCourse.startTime}.`);
        } else {
          throw new Error(`Tous vos cours pour aujourd'hui sont terminés.`);
        }
      }
    } catch (e: any) {
      console.error("Scan processing error:", e);
      setError(e.message || "Erreur lors du traitement du pointage.");
    } finally {
      setIsScanning(false);
    }
  }, [matchedProfessor, matchedUser, schoolSettings]);

  const handleConfirmAttendance = async () => {
    setIsLoading(true);
    try {
      const [startH, startM] = matchedCourse.startTime.split(':').map(Number);
      const [endH, endM] = matchedCourse.endTime.split(':').map(Number);
      const calculatedHours = Math.max(0, (endH + endM/60) - (startH + startM/60));

      await addAttendance({
        professorId: matchedProfessor.id,
        courseId: matchedCourse.id,
        classId: matchedCourse.classId,
        subjectId: matchedCourse.subjectId,
        date: matchedCourse.date,
        plannedStartTime: matchedCourse.startTime,
        plannedEndTime: matchedCourse.endTime,
        actualStartTime: scannedTimeInfo.time,
        actualEndTime: matchedCourse.endTime,
        status: lastScanStatus,
        calculatedHours: calculatedHours,
        scannedAt: scannedTimeInfo.fullTimestamp,
        validatedByAdmin: false,
        schoolId: matchedUser.schoolId
      });
      setStep('success');
    } catch (err) {
      setError("Erreur lors de l'enregistrement de la présence.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-4 sm:mt-12 px-4 mb-10">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8">
          {step === 'id' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                  <UserIcon className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Pointer Présence</h2>
                <p className="text-gray-500 mt-2">Veuillez entrer votre identifiant pour continuer</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID de connexion</label>
                  <input
                    type="text"
                    disabled={isLoading}
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="Ex: PROF001"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none disabled:bg-gray-50"
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyId()}
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
                <button
                  onClick={handleVerifyId}
                  disabled={!loginId || isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Vérification...
                    </>
                  ) : (
                    <>
                      Suivant
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'scan' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  {matchedProfessor?.firstName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{matchedProfessor?.firstName} {matchedProfessor?.lastName}</p>
                  <p className="text-xs text-gray-500">Prêt pour le scan</p>
                </div>
                <button 
                  onClick={() => setStep('id')}
                  className="ml-auto p-2 text-gray-400 hover:text-gray-600"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">
                  <AlertCircle className="w-4 h-4" />
                  {matchedProfessor ? "Erreur: " + error : error}
                </div>
              )}

              {isScanning ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <QrCode className="w-10 h-10 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">Traitement du scan...</p>
                    <p className="text-sm text-gray-500">Veuillez patienter 2-3 secondes</p>
                  </div>
                </div>
              ) : (
                <QRScanner 
                  onScan={handleScan} 
                  onClose={() => setStep('id')} 
                />
              )}
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Confirmer Présence</h2>
                <p className="text-gray-500 mt-2">Veuillez valider les informations de pointage</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-5 space-y-4 border border-gray-100">
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Date
                  </span>
                  <span className="font-semibold text-gray-900">{scannedTimeInfo?.date}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Heure de pointage
                  </span>
                  <span className="font-semibold text-gray-900">{scannedTimeInfo?.time}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Matière du jour
                  </span>
                  <span className="font-semibold text-gray-900">{matchedCourse?.subjectName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Classe
                  </span>
                  <span className="font-semibold text-gray-900">{matchedCourse?.className}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Statut estimé</span>
                  <span className={clsx(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase",
                    lastScanStatus === 'present' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {lastScanStatus === 'present' ? 'À l\'heure' : 'Retard'}
                  </span>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleConfirmAttendance}
                  disabled={isLoading}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-6 h-6" />}
                  VALIDER LA PRÉSENCE
                </button>
                <button
                  onClick={() => setStep('scan')}
                  disabled={isLoading}
                  className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Annuler / Scanner à nouveau
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-6 py-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mb-2">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Pointage Réussi !</h3>
                <p className="text-gray-500 mt-2">Votre présence a été enregistrée automatiquement.</p>
                {lastScanStatus === 'retard' && (
                   <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-amber-700 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
                     <AlertCircle className="w-4 h-4" />
                     Pointé avec retard
                   </div>
                )}
                {lastScanStatus === 'present' && (
                   <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200">
                     <CheckCircle2 className="w-4 h-4" />
                     Pointé à l'heure
                   </div>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-4 animate-pulse">
                Fermeture automatique dans quelques secondes...
              </p>
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Fermer maintenant
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 text-center">
        <button 
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-600 text-sm font-medium flex items-center justify-center gap-2 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
      </div>
    </div>
  );
}

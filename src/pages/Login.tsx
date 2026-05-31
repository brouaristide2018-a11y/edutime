import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Building2, LogIn, Lock, Mail, Eye, EyeOff, UserPlus, User, CheckCircle, ArrowLeft } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { RegisterForm } from './RegisterForm';

export function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentBg, setCurrentBg] = useState(0);
  const setCurrentUser = useStore(state => state.setCurrentUser);
  const settings = useStore(state => state.settings);
  const platformSettings = useStore(state => state.platformSettings);
  const updateSettings = useStore(state => state.updateSettings);
  const navigate = useNavigate();

  const defaultImages = [
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=2070",
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=2070",
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=2070",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=2070"
  ];

  const publicSite = platformSettings?.publicSite;
  const bgImages = publicSite?.heroBgImages && publicSite.heroBgImages.length > 0 ? publicSite.heroBgImages : defaultImages;
  const sliderDuration = publicSite?.sliderDuration || 3000;

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % bgImages.length);
    }, sliderDuration);
    return () => clearInterval(timer);
  }, [bgImages.length, sliderDuration]);

  const handleRegister = async (formData: any) => {
    try {
      setIsLoading(true);
      setError('');
      setRegistrationSuccess(false);

      // Create user in Firebase Auth using the school's email
      const userCredential = await createUserWithEmailAndPassword(auth, formData.emailEtablissement, formData.password);
      const user = userCredential.user;

      // Generate a unique school ID
      const schoolId = `school_${Math.random().toString(36).substr(2, 9)}`;

      // Create admin user document in Firestore with 'En attente' status
      const newAdmin = {
        name: formData.nomEtablissement,
        email: formData.emailEtablissement, // Compte associé à l'email de l'établissement
        role: 'Admin',
        status: 'En attente',
        schoolId: schoolId,
        schoolCode: formData.codeEtablissement,
        schoolEmail: formData.emailEtablissement,
        subscriptionStatus: 'inactive',
        lastLogin: new Date().toISOString(),
        permissions: {
          planning: { view: true, add: true, edit: true, delete: true },
          payroll: { view: true, add: true, edit: true, delete: true },
          users: { view: true, add: true, edit: true, delete: true },
          settings: { view: true, add: true, edit: true, delete: true },
        }
      };
      
      await setDoc(doc(db, 'users', formData.emailEtablissement), newAdmin);
      
      // Store registration data for Super Admin validation
      await setDoc(doc(db, 'registrations', formData.emailEtablissement), {
        ...formData,
        schoolId: schoolId,
        status: 'En attente',
        createdAt: new Date().toISOString()
      });

      // Initialize default settings for the school with registration info
      const defaultSettings = {
        schoolName: formData.nomEtablissement,
        address: formData.adresse,
        phone: formData.etablissementContact1,
        email: formData.emailEtablissement,
        currency: 'FCFA',
        timezone: 'Africa/Abidjan',
        dateFormat: 'DD/MM/YYYY',
        language: 'fr',
        toleranceTime: 10,
        autoLateAfter: 15,
        mandatoryAttendance: true,
        allowedMethods: {
          manual: true,
          qrCode: false,
          geolocation: false,
        },
        validation: {
          auto: true,
          admin: false,
        },
        defaultHourlyRate: 5000,
        overtimeEnabled: true,
        overtimeCoefficient: 1.25,
        deductions: {
          absence: true,
          lateness: true,
          advance: true,
        },
        rounding: '15',
        notifications: {
          email: true,
          sms: false,
          whatsapp: false,
          triggers: {
            professorAbsence: true,
            scheduleChange: true,
            paymentMade: true,
          },
        },
        security: {
          minPasswordLength: 8,
          twoFactorAuth: false,
          sessionExpiration: 120,
        },
        integrations: {
          googleCalendar: false,
          excelExport: true,
          mobileMoney: false,
        },
        modules: {
          professors: true,
          classes: true,
          schedule: true,
          attendance: true,
          requests: true,
          payroll: true,
          support: true,
        },
        subscription: {
          plan: 'Essai',
          trialStartDate: new Date().toISOString(),
          // Trial is 30 days
          trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'Essai',
          maxClasses: 10,
          maxProfessors: 10,
        }
      };
      await setDoc(doc(db, 'settings', schoolId), defaultSettings);

      // Sign out the newly created auth user so they don't stay logged in while pending
      await auth.signOut();
      
      setRegistrationSuccess(true);
      setIsRegistering(false);
    } catch (err: any) {
      console.error('Registration error:', err);
      // Firebase specific errors
      if (err.code === 'auth/email-already-in-use') {
        setError('Cette adresse email est déjà utilisée.');
      } else if (err.code === 'auth/weak-password' || (err.message && err.message.includes('weak-password'))) {
        setError('Le mot de passe doit contenir au moins 6 caractères.');
      } else {
        setError('Erreur lors de l\'inscription. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const ensureSuperAdminEmailAvailable = async () => {
    try {
      const userDocRef = doc(db, 'users', 'cydrovis@gmail.com');
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData.role !== 'SuperAdmin') {
          // Migrate to brouaristide034@gmail.com
          const newDocRef = doc(db, 'users', 'brouaristide034@gmail.com');
          await setDoc(newDocRef, {
            ...userData,
            email: 'brouaristide034@gmail.com',
            id: 'brouaristide034@gmail.com'
          });
          await deleteDoc(userDocRef);
          console.log("Migrated cydrovis@gmail.com to brouaristide034@gmail.com");
        }
      }
    } catch (err) {
      console.error("Error migrating user:", err);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError('');
      setRegistrationSuccess(false);

      const loginEmailValue = email.trim();

      // Super Admin Shortcut
      if ((loginEmailValue === '26' || loginEmailValue === 'cydrovis@gmail.com') && password === 'admin123') {
        try {
          await signInWithEmailAndPassword(auth, 'superadmin@edutime.fr', 'admin123');
        } catch (err: any) {
          if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
            try {
              await createUserWithEmailAndPassword(auth, 'superadmin@edutime.fr', 'admin123');
            } catch (createErr: any) {
              if (createErr.code !== 'auth/email-already-in-use') throw createErr;
              // If already exists but sign in failed, it's a real password error
              await signInWithEmailAndPassword(auth, 'superadmin@edutime.fr', 'admin123');
            }
          } else {
            throw err;
          }
        }
        await ensureSuperAdminEmailAvailable();
        setCurrentUser({ 
          id: 'super-admin', 
          name: 'Super Administrateur', 
          role: 'SuperAdmin', 
          email: 'cydrovis@gmail.com',
          status: 'Actif'
        } as any);
        navigate('/super-admin');
        return;
      }
      
      // Determine actual email for Firebase Auth and find user Document
      let firebaseEmail = loginEmailValue;
      let userData: any = null;
      let userDocId: string = loginEmailValue;

      const usersRef = collection(db, 'users');
      // Sequential search across possible identifiers
      let q = query(usersRef, where('email', '==', loginEmailValue));
      let querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        q = query(usersRef, where('schoolEmail', '==', loginEmailValue));
        querySnapshot = await getDocs(q);
      }

      if (querySnapshot.empty) {
        q = query(usersRef, where('schoolCode', '==', loginEmailValue));
        querySnapshot = await getDocs(q);
      }

      if (querySnapshot.empty) {
        q = query(usersRef, where('loginId', '==', loginEmailValue));
        querySnapshot = await getDocs(q);
      }

      if (!querySnapshot.empty) {
        const foundDoc = querySnapshot.docs[0];
        userData = foundDoc.data();
        firebaseEmail = userData.email || firebaseEmail;
        userDocId = foundDoc.id;
      } else if (!loginEmailValue.includes('@')) {
         firebaseEmail = `${loginEmailValue}@edutime.local`;
      }

      // Firebase Authentication
      try {
        await signInWithEmailAndPassword(auth, firebaseEmail, password);
      } catch (authError: any) {
        // Handle Lazy Auth Account Creation if user exists in Firestore and password matches (mostly for newly added professors)
        if ((authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential' || authError.code === 'auth/invalid-login-credentials') && userData && userData.password === password) {
          try {
            await createUserWithEmailAndPassword(auth, firebaseEmail, password);
          } catch (createErr: any) {
             if (createErr.code === 'auth/email-already-in-use') {
               throw authError; // They gave the wrong password for an existing account
             }
             throw createErr;
          }
        } else {
          throw authError;
        }
      }
      
      // Fallback: If userData wasn't retrieved through the custom query (e.g. login is direct email, query found it or direct getDoc)
      if (!userData) {
        const userDoc = await getDoc(doc(db, 'users', firebaseEmail));
        if (userDoc.exists()) {
          userData = userDoc.data();
          userDocId = userDoc.id;
        }
      }

      if (userData) {
        // Enforce Subscription / School Suspension checks if applicable
        if (userData.schoolId) {
          const settingsDoc = await getDoc(doc(db, 'settings', userData.schoolId));
          if (settingsDoc.exists()) {
             const schoolSettings = settingsDoc.data();
             const subStatus = schoolSettings.subscription?.status;
             if (subStatus === 'Suspendu') {
                setError("Oups! Le compte de l'établissement a été suspendu suite à un non paiement ou à la fin de la période d'essai.");
                await auth.signOut();
                setIsLoading(false);
                return;
             }
          }
        }

        if (userData.status === 'Actif') {
          setCurrentUser({ id: userDocId, ...userData });
          navigate(userData.role === 'Professeur' ? '/prof' : '/admin');
        } else if (userData.status === 'En attente') {
          setError('Compte en attente de validation.');
          await auth.signOut();
        } else if (userData.status === 'Suspendu') {
          setError('Votre compte a été suspendu par l\'administration.');
          await auth.signOut();
        } else {
          setError('Compte inactif.');
          await auth.signOut();
        }
      } else {
        setError('Compte introuvable dans la base de données.');
        await auth.signOut();
      }
      
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Identifiants invalides.');
      } else {
        setError('Erreur lors de la connexion.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user.email === 'cydrovis@gmail.com') {
        await ensureSuperAdminEmailAvailable();
        setCurrentUser({ 
          id: 'super-admin', 
          name: 'Super Administrateur', 
          role: 'SuperAdmin', 
          email: 'cydrovis@gmail.com',
          status: 'Actif'
        } as any);
        navigate('/super-admin');
        return;
      }

      // Check if user exists in Firestore by email
      const userDoc = await getDoc(doc(db, 'users', user.email!));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as any;
        
        if (userData.status === 'Inactif') {
          setError('Votre compte est inactif. Veuillez contacter l\'administrateur.');
          await auth.signOut();
          return;
        }

        if (userData.status === 'Suspendu') {
          setError('Votre compte a été suspendu par l\'administration.');
          await auth.signOut();
          return;
        }
        
        if (userData.status === 'En attente') {
          setError('Votre compte est en attente de validation par un Super Administrateur.');
          await auth.signOut();
          return;
        }
        setCurrentUser({ id: user.email!, ...userData });
        if (userData.role === 'Professeur') {
          navigate('/prof');
        } else {
          navigate('/');
        }
      } else {
        setError('Aucun compte associé à cette adresse email.');
        await auth.signOut();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Erreur lors de la connexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Slider */}
      <div className="absolute inset-0 z-0">
        {bgImages.map((img, index) => (
          <div 
            key={img} 
            className={`absolute inset-0 transition-opacity duration-1000 ${currentBg === index ? 'opacity-100' : 'opacity-0'}`} 
            style={{ backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' }} 
          />
        ))}
        {/* Overlay to ensure text readability while keeping image visible */}
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px]"></div>
      </div>

      <button
        onClick={() => navigate('/')}
        className="fixed md:absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center gap-2 text-gray-800 hover:text-indigo-700 transition-colors group z-50 bg-white/80 backdrop-blur-md px-3 py-2 rounded-lg shadow-sm border border-white/50"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-semibold">Retour</span>
      </button>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 pt-8 sm:pt-0">
        <div className="flex justify-center">
          {publicSite?.logoUrl ? (
            <div className="transform hover:scale-105 transition-transform bg-white/50 backdrop-blur-sm p-3 sm:p-4 rounded-3xl shadow-lg border border-white/50">
                <img src={publicSite.logoUrl} alt="EduTime Logo" className="h-12 sm:h-16 object-contain drop-shadow-md" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <Building2 size={28} className="text-white" />
            </div>
          )}
        </div>
        <h2 className="mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900 drop-shadow-sm">
          {isRegistering ? 'Inscription' : 'EduTime'}
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-gray-700 drop-shadow-sm px-4">
          {isRegistering ? 'Créez votre espace de gestion' : 'Connectez-vous à votre espace de gestion'}
        </p>
      </div>

      <div className={`mt-8 sm:mx-auto sm:w-full ${isRegistering ? 'sm:max-w-4xl' : 'sm:max-w-md'} relative z-10`}>
        <div className="bg-white/95 backdrop-blur-md py-8 px-5 shadow-2xl rounded-2xl sm:px-10 border border-white/50 ring-1 ring-gray-900/5 mx-2 sm:mx-0">
          <div className="space-y-6">
            {registrationSuccess && !isRegistering && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      Votre inscription a été soumise avec succès. Elle est en attente de validation par l'administrateur général.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && !isRegistering && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Lock className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {isRegistering ? (
              <RegisterForm 
                onSubmit={handleRegister} 
                onCancel={() => {
                  setIsRegistering(false);
                  setError('');
                }}
                isLoading={isLoading}
                error={error}
              />
            ) : (
              <form onSubmit={handleManualLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email ou Identifiant
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-2 border"
                      placeholder="admin@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Mot de passe
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-2 border"
                      placeholder="••••••••"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" aria-hidden="true" />
                        ) : (
                          <Eye className="h-5 w-5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    {isLoading ? 'Connexion en cours...' : 'Se connecter'}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Ou</span>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  type="button"
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  {isLoading ? 'Connexion en cours...' : 'Se connecter avec Google'}
                </button>

                <button
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError('');
                    setEmail('');
                    setPassword('');
                  }}
                  type="button"
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isRegistering ? 'Déjà un compte ? Se connecter' : 'Créer un établissement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

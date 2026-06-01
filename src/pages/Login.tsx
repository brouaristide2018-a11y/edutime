import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Building2, LogIn, Lock, Mail, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';
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
  const platformSettings = useStore(state => state.platformSettings);
  const addRegistration = useStore(state => state.addRegistration);
  const addUser = useStore(state => state.addUser);
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

      const schoolId = `school_${Math.random().toString(36).substr(2, 9)}`;

      const newAdmin = {
        name: formData.nomEtablissement,
        email: formData.emailEtablissement,
        password: formData.password,
        role: 'Admin' as const,
        status: 'En attente' as const,
        schoolId: schoolId,
        schoolCode: formData.codeEtablissement,
        schoolEmail: formData.emailEtablissement,
        subscriptionStatus: 'inactive' as const,
        lastLogin: new Date().toISOString(),
        permissions: {
          planning: { view: true, add: true, edit: true, delete: true },
          payroll: { view: true, add: true, edit: true, delete: true },
          users: { view: true, add: true, edit: true, delete: true },
          settings: { view: true, add: true, edit: true, delete: true },
        }
      };

      addUser({ ...newAdmin, id: formData.emailEtablissement });

      addRegistration({
        ...formData,
        schoolId: schoolId,
        status: 'En attente',
        createdAt: new Date().toISOString()
      });

      setRegistrationSuccess(true);
      setIsRegistering(false);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError('Erreur lors de l\'inscription. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
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
        setCurrentUser({
          id: 'super-admin',
          name: 'Super Administrateur',
          role: 'SuperAdmin',
          email: 'cydrovis@gmail.com',
          status: 'Actif',
          permissions: {
            planning: { view: true, add: true, edit: true, delete: true },
            payroll: { view: true, add: true, edit: true, delete: true },
            users: { view: true, add: true, edit: true, delete: true },
            settings: { view: true, add: true, edit: true, delete: true },
          }
        } as any);
        navigate('/super-admin');
        return;
      }

      // Search user in local store
      const users = useStore.getState().users;
      const userData = users.find(u =>
        (u.email === loginEmailValue ||
         u.loginId === loginEmailValue ||
         u.schoolCode === loginEmailValue ||
         u.schoolEmail === loginEmailValue)
      );

      if (!userData) {
        setError('Identifiants invalides.');
        return;
      }

      // Verify password
      if (userData.password && userData.password !== password) {
        setError('Identifiants invalides.');
        return;
      }

      // Check subscription status in settings (local check)
      if (userData.schoolId) {
        const settings = useStore.getState().settings;
        if (settings.subscription?.status === 'Suspendu') {
          setError("Oups! Le compte de l'établissement a été suspendu suite à un non paiement ou à la fin de la période d'essai.");
          return;
        }
      }

      if (userData.status === 'Actif') {
        setCurrentUser(userData);
        navigate(userData.role === 'Professeur' ? '/prof' : '/admin');
      } else if (userData.status === 'En attente') {
        setError('Compte en attente de validation.');
      } else if (userData.status === 'Suspendu') {
        setError('Votre compte a été suspendu par l\'administration.');
      } else {
        setError('Compte inactif.');
      }

    } catch (err: any) {
      console.error('Login error:', err);
      setError('Erreur lors de la connexion.');
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
                  disabled
                  type="button"
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-400 bg-gray-50 cursor-not-allowed"
                >
                  <svg className="w-5 h-5 mr-2 opacity-40" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Connexion Google (disponible prochainement)
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

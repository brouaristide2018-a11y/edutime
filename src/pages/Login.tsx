import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { api } from '../api';
import {
  Building2, LogIn, Lock, Eye, EyeOff, CheckCircle,
  ArrowLeft, Hash, AlertCircle
} from 'lucide-react';
import { RegisterForm } from './RegisterForm';

export function Login() {
  const [isRegistering, setIsRegistering]       = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [identifier, setIdentifier]             = useState('');
  const [password, setPassword]                 = useState('');
  const [showPassword, setShowPassword]         = useState(false);
  const [error, setError]                       = useState('');
  const [isLoading, setIsLoading]               = useState(false);
  const [currentBg, setCurrentBg]               = useState(0);

  const platformSettings = useStore(state => state.platformSettings);
  const addRegistration  = useStore(state => state.addRegistration);
  const addUser          = useStore(state => state.addUser);
  const login            = useStore(state => state.login);
  const syncFromAPI      = useStore(state => state.syncFromAPI);
  const navigate         = useNavigate();

  const defaultImages = [
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=2070",
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=2070",
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=2070",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=2070",
  ];

  const publicSite    = platformSettings?.publicSite;
  const bgImages      = publicSite?.heroBgImages?.length ? publicSite.heroBgImages : defaultImages;
  const sliderDuration = publicSite?.sliderDuration || 3000;

  React.useEffect(() => {
    const t = setInterval(() => setCurrentBg(p => (p + 1) % bgImages.length), sliderDuration);
    return () => clearInterval(t);
  }, [bgImages.length, sliderDuration]);

  // ─── Inscription ──────────────────────────────────────────────────────────
  const handleRegister = async (formData: any) => {
    try {
      setIsLoading(true);
      setError('');
      try {
        await api.auth.register(formData);
      } catch {
        const schoolId = `school_${Math.random().toString(36).substr(2, 9)}`;
        addUser({
          id: formData.emailEtablissement,
          name: formData.nomEtablissement,
          email: formData.emailEtablissement,
          password: formData.password,
          role: 'Admin' as const,
          status: 'En attente' as const,
          schoolId,
          schoolCode: formData.codeEtablissement,
          schoolEmail: formData.emailEtablissement,
          subscriptionStatus: 'inactive' as const,
          lastLogin: new Date().toISOString(),
          permissions: {
            planning: { view: true, add: true, edit: true, delete: true },
            payroll:  { view: true, add: true, edit: true, delete: true },
            users:    { view: true, add: true, edit: true, delete: true },
            settings: { view: true, add: true, edit: true, delete: true },
          },
        });
        addRegistration({ ...formData, schoolId, status: 'En attente', createdAt: new Date().toISOString() });
      }
      setRegistrationSuccess(true);
      setIsRegistering(false);
    } catch (err: any) {
      setError('Erreur lors de l\'inscription. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Connexion ────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Réinitialise l'erreur

    const id = identifier.trim();
    if (!id || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(id, password);

      if (!success) {
        setError('Identifiants ou mot de passe incorrect.');
        return;
      }

      const currentUser = useStore.getState().currentUser;
      if (!currentUser) {
        setError('Erreur lors de la récupération du profil.');
        return;
      }

      if (currentUser.schoolId) {
        syncFromAPI(currentUser.schoolId).catch(() => {});
      }

      if (currentUser.role === 'SuperAdmin') {
        navigate('/super-admin');
      } else if (currentUser.role === 'Professeur') {
        navigate('/prof');
      } else {
        navigate('/admin');
      }

    } catch (err: any) {
      // L'erreur est affichée ICI et ne disparaît pas
      setError(err.message || 'Identifiants ou mot de passe incorrect.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Détecter le type d'identifiant ───────────────────────────────────────
  const isSchoolCode    = /^\d{6}$/.test(identifier.trim());    // ex: 310682
  const isProfCode      = /^\d{9,}$/.test(identifier.trim());   // ex: 310682001
  const isSuperAdmin    = identifier.trim() === '26';

  const getIdentifierHint = () => {
    if (isSuperAdmin)   return { text: 'Super Administrateur', color: 'text-purple-600' };
    if (isProfCode)     return { text: 'Professeur', color: 'text-blue-600' };
    if (isSchoolCode)   return { text: 'Établissement', color: 'text-indigo-600' };
    return null;
  };

  const hint = getIdentifierHint();

  // ─── Rendu ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">

      {/* Background Slider */}
      <div className="absolute inset-0 z-0">
        {bgImages.map((img, i) => (
          <div
            key={img}
            className={`absolute inset-0 transition-opacity duration-1000 ${currentBg === i ? 'opacity-100' : 'opacity-0'}`}
            style={{ backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
        ))}
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px]" />
      </div>

      {/* Bouton retour */}
      <button
        onClick={() => navigate('/')}
        className="fixed md:absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center gap-2 text-gray-800 hover:text-indigo-700 transition-colors group z-50 bg-white/80 backdrop-blur-md px-3 py-2 rounded-lg shadow-sm border border-white/50"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-semibold">Retour</span>
      </button>

      {/* Logo + titre */}
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
          {isRegistering ? 'Créez votre espace de gestion' : 'Connectez-vous à votre espace'}
        </p>
      </div>

      {/* Formulaire */}
      <div className={`mt-8 sm:mx-auto sm:w-full ${isRegistering ? 'sm:max-w-4xl' : 'sm:max-w-md'} relative z-10`}>
        <div className="bg-white/95 backdrop-blur-md py-8 px-5 shadow-2xl rounded-2xl sm:px-10 border border-white/50 ring-1 ring-gray-900/5 mx-2 sm:mx-0">
          <div className="space-y-5">

            {/* Message inscription réussie */}
            {registrationSuccess && !isRegistering && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <p className="text-sm text-green-700">
                  Inscription soumise. En attente de validation par l'administrateur général.
                </p>
              </div>
            )}

            {/* Message d'erreur */}
            {error && !isRegistering && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3 animate-shake">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Connexion impossible</p>
                  <p className="text-sm text-red-600 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {isRegistering ? (
              <RegisterForm
                onSubmit={handleRegister}
                onCancel={() => { setIsRegistering(false); setError(''); }}
                isLoading={isLoading}
                error={error}
              />
            ) : (
              <form onSubmit={handleLogin} className="space-y-5">

                {/* Champ identifiant */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Code établissement ou identifiant
                  </label>

                  {/* Aide contextuelle */}
                  <div className="mb-2 flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                      <Building2 size={11} /> Établissement : <strong>310682</strong>
                    </span>
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                      <Hash size={11} /> Professeur : <strong>310682001</strong>
                    </span>
                  </div>

                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Hash className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="block w-full pl-10 pr-24 sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 py-2.5"
                      placeholder="310682 ou 310682001"
                      autoComplete="username"
                    />
                    {/* Badge type détecté */}
                    {hint && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <span className={`text-xs font-semibold ${hint.color}`}>{hint.text}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Champ mot de passe */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Mot de passe
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 py-2.5"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bouton connexion */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Connexion en cours...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Se connecter
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Bouton inscription */}
            {!isRegistering && (
              <div className="pt-2">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-gray-400">Vous êtes un nouvel établissement ?</span>
                  </div>
                </div>
                <button
                  onClick={() => { setIsRegistering(true); setError(''); setIdentifier(''); setPassword(''); }}
                  type="button"
                  className="mt-4 w-full flex justify-center items-center py-2.5 px-4 border border-indigo-200 rounded-lg text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                >
                  Créer un espace établissement
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Note d'aide */}
        {!isRegistering && (
          <p className="mt-4 text-center text-xs text-gray-500 drop-shadow-sm">
            Professeurs : votre identifiant vous a été communiqué par l'administrateur de l'établissement
          </p>
        )}
      </div>
    </div>
  );
}

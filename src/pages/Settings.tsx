import React, { useState } from 'react';
import { useStore } from '../store';
import { 
  Building2, 
  Users, 
  Clock, 
  Banknote, 
  Bell, 
  Link as LinkIcon, 
  ShieldCheck, 
  Save,
  Check
} from 'lucide-react';
import { UsersSettings } from './UsersSettings';
import { compressImage } from '../utils/image';

type TabType = 'general' | 'establishment' | 'users' | 'attendance' | 'payroll' | 'notifications' | 'integrations' | 'security';

export default function Settings() {
  const { settings, updateSettings } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('establishment');
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Sync local settings when external settings change (e.g. from Firestore)
  // but only if we are not currently editing
  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(localSettings);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'establishment', label: 'Établissement', icon: Building2 },
    { id: 'users', label: 'Utilisateurs & rôles', icon: Users },
    { id: 'attendance', label: 'Règles de pointage', icon: Clock },
    { id: 'payroll', label: 'Règles de paie', icon: Banknote },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Intégrations', icon: LinkIcon },
    { id: 'security', label: 'Sécurité', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {isSaving ? <Clock className="w-5 h-5 animate-spin" /> : showSaved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          {isSaving ? 'Enregistrement...' : showSaved ? 'Enregistré !' : 'Enregistrer tout'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <nav className="flex flex-col">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {activeTab === 'establishment' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations de l'établissement</h2>
                
                <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 mb-6">
                  {/* Photo de profil de l'établissement */}
                  <div className="flex flex-col items-center space-y-3">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                        {localSettings.logo ? (
                          <img src={localSettings.logo} alt="Logo de l'établissement" className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-10 h-10 text-gray-400" />
                        )}
                      </div>
                      <label 
                        htmlFor="logo-upload" 
                        className="absolute bottom-1 right-1 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors shadow-sm"
                        title="Changer le logo"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <input 
                          id="logo-upload" 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                alert("L'image est trop grande. Veuillez choisir une image de moins de 2Mo.");
                                return;
                              }
                              try {
                                const compressedDataUrl = await compressImage(file, 256, 256);
                                setLocalSettings({ ...localSettings, logo: compressedDataUrl });
                              } catch (error) {
                                console.error('Error compressing image:', error);
                                alert("Une erreur s'est produite lors de la compression de l'image.");
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div className="text-center">
                      <h3 className="text-sm font-medium text-gray-900">Logo</h3>
                      <p className="text-xs text-gray-500">JPG, PNG ou GIF (Max. 2MB)</p>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'établissement</label>
                      <input
                        type="text"
                        value={localSettings.schoolName}
                        onChange={(e) => setLocalSettings({ ...localSettings, schoolName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
                      <input
                        type="text"
                        value={localSettings.currency}
                        onChange={(e) => setLocalSettings({ ...localSettings, currency: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                    <input
                      type="text"
                      value={localSettings.address}
                      onChange={(e) => setLocalSettings({ ...localSettings, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={localSettings.phone}
                      onChange={(e) => setLocalSettings({ ...localSettings, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={localSettings.email}
                      onChange={(e) => setLocalSettings({ ...localSettings, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">Configuration</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fuseau horaire</label>
                    <select
                      value={localSettings.timezone}
                      onChange={(e) => setLocalSettings({ ...localSettings, timezone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="Europe/Paris">Europe/Paris</option>
                      <option value="Africa/Dakar">Africa/Dakar</option>
                      <option value="Africa/Abidjan">Africa/Abidjan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Format date</label>
                    <select
                      value={localSettings.dateFormat}
                      onChange={(e) => setLocalSettings({ ...localSettings, dateFormat: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="DD/MM/YYYY">JJ/MM/AAAA</option>
                      <option value="MM/DD/YYYY">MM/JJ/AAAA</option>
                      <option value="YYYY-MM-DD">AAAA-MM-JJ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Langue</label>
                    <select
                      value={localSettings.language}
                      onChange={(e) => setLocalSettings({ ...localSettings, language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Règles de pointage</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heure de tolérance (minutes)</label>
                    <input
                      type="number"
                      value={isNaN(localSettings.toleranceTime) ? '' : localSettings.toleranceTime}
                      onChange={(e) => setLocalSettings({ ...localSettings, toleranceTime: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Retard automatique après (minutes)</label>
                    <input
                      type="number"
                      value={isNaN(localSettings.autoLateAfter) ? '' : localSettings.autoLateAfter}
                      onChange={(e) => setLocalSettings({ ...localSettings, autoLateAfter: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={localSettings.mandatoryAttendance}
                      onChange={(e) => setLocalSettings({ ...localSettings, mandatoryAttendance: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Obligation de pointage</span>
                  </label>
                </div>

                <h3 className="text-md font-medium text-gray-900 mt-6 mb-3">Méthodes autorisées</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={localSettings.allowedMethods.manual}
                      onChange={(e) => setLocalSettings({ 
                        ...localSettings, 
                        allowedMethods: { ...localSettings.allowedMethods, manual: e.target.checked } 
                      })}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Saisie manuelle</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={localSettings.allowedMethods.qrCode}
                      onChange={(e) => setLocalSettings({ 
                        ...localSettings, 
                        allowedMethods: { ...localSettings.allowedMethods, qrCode: e.target.checked } 
                      })}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">QR Code</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={localSettings.allowedMethods.geolocation}
                      onChange={(e) => setLocalSettings({ 
                        ...localSettings, 
                        allowedMethods: { ...localSettings.allowedMethods, geolocation: e.target.checked } 
                      })}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Géolocalisation</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'payroll' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Règles de paie</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Taux horaire par défaut ({localSettings.currency})</label>
                    <input
                      type="number"
                      value={isNaN(localSettings.defaultHourlyRate) ? '' : localSettings.defaultHourlyRate}
                      onChange={(e) => setLocalSettings({ ...localSettings, defaultHourlyRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Arrondi du temps</label>
                    <select
                      value={localSettings.rounding}
                      onChange={(e) => setLocalSettings({ ...localSettings, rounding: e.target.value as '15' | '30' | '60' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="15">Au quart d'heure (15 min)</option>
                      <option value="30">À la demi-heure (30 min)</option>
                      <option value="60">À l'heure (60 min)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-medium text-gray-900">Heures supplémentaires</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={localSettings.overtimeEnabled}
                        onChange={(e) => setLocalSettings({ ...localSettings, overtimeEnabled: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  
                  {localSettings.overtimeEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Coefficient majoration</label>
                      <input
                        type="number"
                        step="0.05"
                        value={isNaN(localSettings.overtimeCoefficient) ? '' : localSettings.overtimeCoefficient}
                        onChange={(e) => setLocalSettings({ ...localSettings, overtimeCoefficient: parseFloat(e.target.value) || 1 })}
                        className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Ex: 1.25 pour +25%</p>
                    </div>
                  )}
                </div>

                <h3 className="text-md font-medium text-gray-900 mt-6 mb-3">Déductions automatiques</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={localSettings.deductions.absence}
                      onChange={(e) => setLocalSettings({ 
                        ...localSettings, 
                        deductions: { ...localSettings.deductions, absence: e.target.checked } 
                      })}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Absence non justifiée</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={localSettings.deductions.lateness}
                      onChange={(e) => setLocalSettings({ 
                        ...localSettings, 
                        deductions: { ...localSettings.deductions, lateness: e.target.checked } 
                      })}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Retards cumulés</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Canaux de notification</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Email</h4>
                      <p className="text-sm text-gray-500">Notifications standards gratuites</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={localSettings.notifications.email}
                        onChange={(e) => setLocalSettings({ 
                          ...localSettings, 
                          notifications: { ...localSettings.notifications, email: e.target.checked } 
                        })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">SMS</h4>
                      <p className="text-sm text-gray-500">Nécessite une intégration API (Twilio, etc.)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={localSettings.notifications.sms}
                        onChange={(e) => setLocalSettings({ 
                          ...localSettings, 
                          notifications: { ...localSettings.notifications, sms: e.target.checked } 
                        })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">WhatsApp</h4>
                      <p className="text-sm text-gray-500">Option Pro - API WhatsApp Business</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={localSettings.notifications.whatsapp}
                        onChange={(e) => setLocalSettings({ 
                          ...localSettings, 
                          notifications: { ...localSettings.notifications, whatsapp: e.target.checked } 
                        })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>

                <h3 className="text-md font-medium text-gray-900 mt-8 mb-4">Événements déclencheurs</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={localSettings.notifications.triggers.professorAbsence}
                      onChange={(e) => setLocalSettings({ 
                        ...localSettings, 
                        notifications: { 
                          ...localSettings.notifications, 
                          triggers: { ...localSettings.notifications.triggers, professorAbsence: e.target.checked } 
                        } 
                      })}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Absence d'un professeur</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={localSettings.notifications.triggers.scheduleChange}
                      onChange={(e) => setLocalSettings({ 
                        ...localSettings, 
                        notifications: { 
                          ...localSettings.notifications, 
                          triggers: { ...localSettings.notifications.triggers, scheduleChange: e.target.checked } 
                        } 
                      })}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Modification du planning</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={localSettings.notifications.triggers.paymentMade}
                      onChange={(e) => setLocalSettings({ 
                        ...localSettings, 
                        notifications: { 
                          ...localSettings.notifications, 
                          triggers: { ...localSettings.notifications.triggers, paymentMade: e.target.checked } 
                        } 
                      })}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Paiement effectué</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Sécurité</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longueur minimale du mot de passe</label>
                    <input
                      type="number"
                      min="6"
                      value={isNaN(localSettings.security.minPasswordLength) ? '' : localSettings.security.minPasswordLength}
                      onChange={(e) => setLocalSettings({ 
                        ...localSettings, 
                        security: { ...localSettings.security, minPasswordLength: parseInt(e.target.value) || 8 } 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiration de session (minutes)</label>
                    <input
                      type="number"
                      min="15"
                      value={isNaN(localSettings.security.sessionExpiration) ? '' : localSettings.security.sessionExpiration}
                      onChange={(e) => setLocalSettings({ 
                        ...localSettings, 
                        security: { ...localSettings.security, sessionExpiration: parseInt(e.target.value) || 120 } 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Authentification à deux facteurs (2FA)</h4>
                      <p className="text-sm text-gray-500">Renforce la sécurité des comptes administrateurs</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={localSettings.security.twoFactorAuth}
                        onChange={(e) => setLocalSettings({ 
                          ...localSettings, 
                          security: { ...localSettings.security, twoFactorAuth: e.target.checked } 
                        })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <UsersSettings />
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Intégrations</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z"></path></svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Google Calendar</h4>
                        <p className="text-xs text-gray-500">Synchro des plannings</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setLocalSettings({
                        ...localSettings,
                        integrations: { ...localSettings.integrations, googleCalendar: !localSettings.integrations.googleCalendar }
                      })}
                      className={`text-sm font-medium ${localSettings.integrations.googleCalendar ? 'text-red-600' : 'text-indigo-600'}`}
                    >
                      {localSettings.integrations.googleCalendar ? 'Déconnecter' : 'Connecter'}
                    </button>
                  </div>
                  
                  <div className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"></path></svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Export Excel</h4>
                        <p className="text-xs text-gray-500">Rapports et paie</p>
                      </div>
                    </div>
                    <button className="text-sm text-gray-400 font-medium" disabled>Actif</button>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                        <Banknote size={24} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Mobile Money</h4>
                        <p className="text-xs text-gray-500">Paiements automatisés</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setLocalSettings({
                        ...localSettings,
                        integrations: { ...localSettings.integrations, mobileMoney: !localSettings.integrations.mobileMoney }
                      })}
                      className={`text-sm font-medium ${localSettings.integrations.mobileMoney ? 'text-red-600' : 'text-indigo-600'}`}
                    >
                      {localSettings.integrations.mobileMoney ? 'Désactiver' : 'Configurer'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

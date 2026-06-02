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
  Check,
  Pencil,
  X
} from 'lucide-react';
import { UsersSettings } from './UsersSettings';
import { compressImage } from '../utils/image';

type TabType = 'establishment' | 'users' | 'attendance' | 'payroll' | 'notifications' | 'integrations' | 'security';

// ─── Composant en-tête de section ────────────────────────────────────────────
function SectionHeader({
  title,
  isEditing,
  isSaving,
  saved,
  onEdit,
  onSave,
  onCancel,
}: {
  title: string;
  isEditing: boolean;
  isSaving: boolean;
  saved: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {isEditing ? (
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
            Annuler
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <Clock className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? 'Enregistrement...' : saved ? 'Enregistré !' : 'Enregistrer'}
          </button>
        </div>
      ) : (
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          <Pencil className="w-4 h-4" />
          Modifier
        </button>
      )}
    </div>
  );
}

// ─── Affichage d'un champ en lecture seule ────────────────────────────────────
function ReadonlyField({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-gray-900 font-medium">{value || <span className="text-gray-400 italic">Non renseigné</span>}</p>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function Settings() {
  const { settings, updateSettings } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('establishment');
  const [localSettings, setLocalSettings] = useState(settings);
  const [savedSettings, setSavedSettings] = useState(settings);
  const [editingTab, setEditingTab] = useState<TabType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  React.useEffect(() => {
    setLocalSettings(settings);
    setSavedSettings(settings);
  }, [settings]);

  const isEditing = editingTab === activeTab;

  const startEditing = () => {
    setLocalSettings(savedSettings);
    setEditingTab(activeTab);
    setShowSaved(false);
  };

  const cancelEditing = () => {
    setLocalSettings(savedSettings);
    setEditingTab(null);
  };

  const saveSection = async () => {
    setIsSaving(true);
    try {
      await updateSettings(localSettings);
      setSavedSettings({ ...localSettings });
      setShowSaved(true);
      setTimeout(() => {
        setShowSaved(false);
        setEditingTab(null);
      }, 1500);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'establishment', label: 'Établissement',      icon: Building2  },
    { id: 'users',         label: 'Utilisateurs & rôles', icon: Users     },
    { id: 'attendance',    label: 'Règles de pointage',  icon: Clock      },
    { id: 'payroll',       label: 'Règles de paie',      icon: Banknote   },
    { id: 'notifications', label: 'Notifications',       icon: Bell       },
    { id: 'integrations',  label: 'Intégrations',        icon: LinkIcon   },
    { id: 'security',      label: 'Sécurité',            icon: ShieldCheck},
  ];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
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
                    onClick={() => {
                      if (editingTab && editingTab !== tab.id) cancelEditing();
                      setActiveTab(tab.id as TabType);
                    }}
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

            {/* ── ÉTABLISSEMENT ─────────────────────────────────────────── */}
            {activeTab === 'establishment' && (
              <div className="space-y-6">
                <SectionHeader
                  title="Informations de l'établissement"
                  isEditing={isEditing}
                  isSaving={isSaving}
                  saved={showSaved}
                  onEdit={startEditing}
                  onSave={saveSection}
                  onCancel={cancelEditing}
                />

                {isEditing ? (
                  <>
                    <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 mb-6">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="relative">
                          <div className="w-32 h-32 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                            {localSettings.logo ? (
                              <img src={localSettings.logo} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                              <Building2 className="w-10 h-10 text-gray-400" />
                            )}
                          </div>
                          <label htmlFor="logo-upload" className="absolute bottom-1 right-1 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 shadow-sm" title="Changer le logo">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 2 * 1024 * 1024) { alert("Image trop grande (max 2Mo)."); return; }
                              try {
                                const compressed = await compressImage(file, 256, 256);
                                setLocalSettings({ ...localSettings, logo: compressed });
                              } catch { alert("Erreur lors de la compression."); }
                            }} />
                          </label>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-medium text-gray-900">Logo</p>
                          <p className="text-xs text-gray-500">JPG, PNG (Max 2Mo)</p>
                        </div>
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'établissement</label>
                          <input type="text" value={localSettings.schoolName} onChange={(e) => setLocalSettings({ ...localSettings, schoolName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
                          <input type="text" value={localSettings.currency} onChange={(e) => setLocalSettings({ ...localSettings, currency: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                        <input type="text" value={localSettings.address} onChange={(e) => setLocalSettings({ ...localSettings, address: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                        <input type="tel" value={localSettings.phone} onChange={(e) => setLocalSettings({ ...localSettings, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" value={localSettings.email} onChange={(e) => setLocalSettings({ ...localSettings, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mt-4">Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fuseau horaire</label>
                        <select value={localSettings.timezone} onChange={(e) => setLocalSettings({ ...localSettings, timezone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                          <option value="Europe/Paris">Europe/Paris</option>
                          <option value="Africa/Dakar">Africa/Dakar</option>
                          <option value="Africa/Abidjan">Africa/Abidjan</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Format date</label>
                        <select value={localSettings.dateFormat} onChange={(e) => setLocalSettings({ ...localSettings, dateFormat: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                          <option value="DD/MM/YYYY">JJ/MM/AAAA</option>
                          <option value="MM/DD/YYYY">MM/JJ/AAAA</option>
                          <option value="YYYY-MM-DD">AAAA-MM-JJ</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Langue</label>
                        <select value={localSettings.language} onChange={(e) => setLocalSettings({ ...localSettings, language: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                          <option value="fr">Français</option>
                          <option value="en">English</option>
                        </select>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row gap-6 items-start">
                      <div className="w-24 h-24 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                        {savedSettings.logo ? <img src={savedSettings.logo} alt="Logo" className="w-full h-full object-cover" /> : <Building2 className="w-8 h-8 text-gray-400" />}
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-4">
                        <ReadonlyField label="Nom de l'établissement" value={savedSettings.schoolName} />
                        <ReadonlyField label="Devise" value={savedSettings.currency} />
                        <ReadonlyField label="Adresse" value={savedSettings.address} />
                        <ReadonlyField label="Téléphone" value={savedSettings.phone} />
                        <ReadonlyField label="Email" value={savedSettings.email} />
                      </div>
                    </div>
                    <div className="border-t border-gray-100 pt-4 mt-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Configuration</p>
                      <div className="grid grid-cols-3 gap-4">
                        <ReadonlyField label="Fuseau horaire" value={savedSettings.timezone} />
                        <ReadonlyField label="Format date" value={savedSettings.dateFormat} />
                        <ReadonlyField label="Langue" value={savedSettings.language === 'fr' ? 'Français' : 'English'} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── UTILISATEURS ──────────────────────────────────────────── */}
            {activeTab === 'users' && <UsersSettings />}

            {/* ── RÈGLES DE POINTAGE ───────────────────────────────────── */}
            {activeTab === 'attendance' && (
              <div className="space-y-6">
                <SectionHeader
                  title="Règles de pointage"
                  isEditing={isEditing}
                  isSaving={isSaving}
                  saved={showSaved}
                  onEdit={startEditing}
                  onSave={saveSection}
                  onCancel={cancelEditing}
                />

                {isEditing ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tolérance (minutes)</label>
                        <input type="number" value={isNaN(localSettings.toleranceTime) ? '' : localSettings.toleranceTime} onChange={(e) => setLocalSettings({ ...localSettings, toleranceTime: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Retard auto après (minutes)</label>
                        <input type="number" value={isNaN(localSettings.autoLateAfter) ? '' : localSettings.autoLateAfter} onChange={(e) => setLocalSettings({ ...localSettings, autoLateAfter: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    </div>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" checked={localSettings.mandatoryAttendance} onChange={(e) => setLocalSettings({ ...localSettings, mandatoryAttendance: e.target.checked })} className="w-4 h-4 text-indigo-600 rounded border-gray-300" />
                      <span className="text-sm font-medium text-gray-700">Obligation de pointage</span>
                    </label>
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-3">Méthodes autorisées</p>
                      <div className="space-y-3">
                        {[
                          { key: 'manual', label: 'Saisie manuelle' },
                          { key: 'qrCode', label: 'QR Code' },
                          { key: 'geolocation', label: 'Géolocalisation' },
                        ].map(({ key, label }) => (
                          <label key={key} className="flex items-center gap-3">
                            <input type="checkbox" checked={(localSettings.allowedMethods as any)[key]} onChange={(e) => setLocalSettings({ ...localSettings, allowedMethods: { ...localSettings.allowedMethods, [key]: e.target.checked } })} className="w-4 h-4 text-indigo-600 rounded border-gray-300" />
                            <span className="text-sm text-gray-700">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <ReadonlyField label="Tolérance" value={`${savedSettings.toleranceTime} minutes`} />
                      <ReadonlyField label="Retard auto après" value={`${savedSettings.autoLateAfter} minutes`} />
                    </div>
                    <div className="flex items-center gap-2 py-2">
                      <span className={`w-2 h-2 rounded-full ${savedSettings.mandatoryAttendance ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm text-gray-700">Obligation de pointage : <strong>{savedSettings.mandatoryAttendance ? 'Activée' : 'Désactivée'}</strong></span>
                    </div>
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Méthodes autorisées</p>
                      <div className="flex flex-wrap gap-2">
                        {savedSettings.allowedMethods.manual && <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium">Saisie manuelle</span>}
                        {savedSettings.allowedMethods.qrCode && <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium">QR Code</span>}
                        {savedSettings.allowedMethods.geolocation && <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium">Géolocalisation</span>}
                        {!savedSettings.allowedMethods.manual && !savedSettings.allowedMethods.qrCode && !savedSettings.allowedMethods.geolocation && <span className="text-sm text-gray-400 italic">Aucune méthode activée</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── RÈGLES DE PAIE ─────────────────────────────────────────── */}
            {activeTab === 'payroll' && (
              <div className="space-y-6">
                <SectionHeader
                  title="Règles de paie"
                  isEditing={isEditing}
                  isSaving={isSaving}
                  saved={showSaved}
                  onEdit={startEditing}
                  onSave={saveSection}
                  onCancel={cancelEditing}
                />

                {isEditing ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Taux horaire par défaut ({localSettings.currency})</label>
                        <input type="number" value={isNaN(localSettings.defaultHourlyRate) ? '' : localSettings.defaultHourlyRate} onChange={(e) => setLocalSettings({ ...localSettings, defaultHourlyRate: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Arrondi du temps</label>
                        <select value={localSettings.rounding} onChange={(e) => setLocalSettings({ ...localSettings, rounding: e.target.value as '15' | '30' | '60' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                          <option value="15">Au quart d'heure (15 min)</option>
                          <option value="30">À la demi-heure (30 min)</option>
                          <option value="60">À l'heure (60 min)</option>
                        </select>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-900">Heures supplémentaires</h3>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={localSettings.overtimeEnabled} onChange={(e) => setLocalSettings({ ...localSettings, overtimeEnabled: e.target.checked })} />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                      {localSettings.overtimeEnabled && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Coefficient majoration</label>
                          <input type="number" step="0.05" value={isNaN(localSettings.overtimeCoefficient) ? '' : localSettings.overtimeCoefficient} onChange={(e) => setLocalSettings({ ...localSettings, overtimeCoefficient: parseFloat(e.target.value) || 1 })} className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                          <p className="text-xs text-gray-500 mt-1">Ex: 1.25 pour +25%</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-3">Déductions automatiques</p>
                      <div className="space-y-3">
                        {[
                          { key: 'absence', label: 'Absence non justifiée' },
                          { key: 'lateness', label: 'Retards cumulés' },
                        ].map(({ key, label }) => (
                          <label key={key} className="flex items-center gap-3">
                            <input type="checkbox" checked={(localSettings.deductions as any)[key]} onChange={(e) => setLocalSettings({ ...localSettings, deductions: { ...localSettings.deductions, [key]: e.target.checked } })} className="w-4 h-4 text-indigo-600 rounded border-gray-300" />
                            <span className="text-sm text-gray-700">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <ReadonlyField label={`Taux horaire (${savedSettings.currency})`} value={`${savedSettings.defaultHourlyRate?.toLocaleString('fr-FR')} ${savedSettings.currency}`} />
                      <ReadonlyField label="Arrondi du temps" value={savedSettings.rounding === '15' ? 'Quart d\'heure' : savedSettings.rounding === '30' ? 'Demi-heure' : 'À l\'heure'} />
                    </div>
                    <div className="flex items-center gap-2 py-2">
                      <span className={`w-2 h-2 rounded-full ${savedSettings.overtimeEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm text-gray-700">Heures supplémentaires : <strong>{savedSettings.overtimeEnabled ? `Activées (×${savedSettings.overtimeCoefficient})` : 'Désactivées'}</strong></span>
                    </div>
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Déductions automatiques</p>
                      <div className="flex flex-wrap gap-2">
                        {savedSettings.deductions.absence && <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-full font-medium">Absence</span>}
                        {savedSettings.deductions.lateness && <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-full font-medium">Retards</span>}
                        {!savedSettings.deductions.absence && !savedSettings.deductions.lateness && <span className="text-sm text-gray-400 italic">Aucune déduction activée</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── NOTIFICATIONS ─────────────────────────────────────────── */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <SectionHeader
                  title="Notifications"
                  isEditing={isEditing}
                  isSaving={isSaving}
                  saved={showSaved}
                  onEdit={startEditing}
                  onSave={saveSection}
                  onCancel={cancelEditing}
                />

                {isEditing ? (
                  <>
                    <div className="space-y-3">
                      {[
                        { key: 'email', label: 'Email', desc: 'Notifications standards gratuites' },
                        { key: 'sms', label: 'SMS', desc: 'Nécessite une intégration API' },
                        { key: 'whatsapp', label: 'WhatsApp', desc: 'Option Pro - API WhatsApp Business' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{label}</p>
                            <p className="text-xs text-gray-500">{desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={(localSettings.notifications as any)[key]} onChange={(e) => setLocalSettings({ ...localSettings, notifications: { ...localSettings.notifications, [key]: e.target.checked } })} />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-3">Événements déclencheurs</p>
                      <div className="space-y-3">
                        {[
                          { key: 'professorAbsence', label: 'Absence d\'un professeur' },
                          { key: 'scheduleChange', label: 'Modification du planning' },
                          { key: 'paymentMade', label: 'Paiement effectué' },
                        ].map(({ key, label }) => (
                          <label key={key} className="flex items-center gap-3">
                            <input type="checkbox" checked={(localSettings.notifications.triggers as any)[key]} onChange={(e) => setLocalSettings({ ...localSettings, notifications: { ...localSettings.notifications, triggers: { ...localSettings.notifications.triggers, [key]: e.target.checked } } })} className="w-4 h-4 text-indigo-600 rounded border-gray-300" />
                            <span className="text-sm text-gray-700">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Canaux actifs</p>
                    <div className="flex flex-wrap gap-2">
                      {savedSettings.notifications.email && <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full font-medium">Email</span>}
                      {savedSettings.notifications.sms && <span className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full font-medium">SMS</span>}
                      {savedSettings.notifications.whatsapp && <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-sm rounded-full font-medium">WhatsApp</span>}
                      {!savedSettings.notifications.email && !savedSettings.notifications.sms && !savedSettings.notifications.whatsapp && <span className="text-sm text-gray-400 italic">Aucun canal activé</span>}
                    </div>
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Déclencheurs actifs</p>
                      <div className="flex flex-wrap gap-2">
                        {savedSettings.notifications.triggers.professorAbsence && <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Absence prof</span>}
                        {savedSettings.notifications.triggers.scheduleChange && <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Modif planning</span>}
                        {savedSettings.notifications.triggers.paymentMade && <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Paiement</span>}
                        {!savedSettings.notifications.triggers.professorAbsence && !savedSettings.notifications.triggers.scheduleChange && !savedSettings.notifications.triggers.paymentMade && <span className="text-sm text-gray-400 italic">Aucun déclencheur</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── INTÉGRATIONS ──────────────────────────────────────────── */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <SectionHeader
                  title="Intégrations"
                  isEditing={isEditing}
                  isSaving={isSaving}
                  saved={showSaved}
                  onEdit={startEditing}
                  onSave={saveSection}
                  onCancel={cancelEditing}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'googleCalendar', label: 'Google Calendar', desc: 'Synchro des plannings', color: 'blue', icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z"></path></svg> },
                    { key: 'mobileMoney', label: 'Mobile Money', desc: 'Paiements automatisés', color: 'orange', icon: <Banknote size={24} /> },
                  ].map(({ key, label, desc, color, icon }) => (
                    <div key={key} className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-${color}-100 text-${color}-600 rounded-lg flex items-center justify-center`}>{icon}</div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{label}</p>
                          <p className="text-xs text-gray-500">{desc}</p>
                        </div>
                      </div>
                      {isEditing ? (
                        <button onClick={() => setLocalSettings({ ...localSettings, integrations: { ...localSettings.integrations, [key]: !(localSettings.integrations as any)[key] } })} className={`text-sm font-medium ${(localSettings.integrations as any)[key] ? 'text-red-600' : 'text-indigo-600'}`}>
                          {(localSettings.integrations as any)[key] ? 'Désactiver' : 'Activer'}
                        </button>
                      ) : (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${(savedSettings.integrations as any)[key] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {(savedSettings.integrations as any)[key] ? 'Actif' : 'Inactif'}
                        </span>
                      )}
                    </div>
                  ))}

                  {/* Export Excel — toujours actif */}
                  <div className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"></path></svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Export Excel</p>
                        <p className="text-xs text-gray-500">Rapports et paie</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">Toujours actif</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── SÉCURITÉ ──────────────────────────────────────────────── */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <SectionHeader
                  title="Sécurité"
                  isEditing={isEditing}
                  isSaving={isSaving}
                  saved={showSaved}
                  onEdit={startEditing}
                  onSave={saveSection}
                  onCancel={cancelEditing}
                />

                {isEditing ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Longueur minimale mot de passe</label>
                        <input type="number" min="6" value={isNaN(localSettings.security.minPasswordLength) ? '' : localSettings.security.minPasswordLength} onChange={(e) => setLocalSettings({ ...localSettings, security: { ...localSettings.security, minPasswordLength: parseInt(e.target.value) || 8 } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiration de session (minutes)</label>
                        <input type="number" min="15" value={isNaN(localSettings.security.sessionExpiration) ? '' : localSettings.security.sessionExpiration} onChange={(e) => setLocalSettings({ ...localSettings, security: { ...localSettings.security, sessionExpiration: parseInt(e.target.value) || 120 } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Authentification à deux facteurs (2FA)</p>
                        <p className="text-xs text-gray-500">Renforce la sécurité des comptes administrateurs</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={localSettings.security.twoFactorAuth} onChange={(e) => setLocalSettings({ ...localSettings, security: { ...localSettings.security, twoFactorAuth: e.target.checked } })} />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <ReadonlyField label="Longueur min. mot de passe" value={`${savedSettings.security.minPasswordLength} caractères`} />
                      <ReadonlyField label="Expiration de session" value={`${savedSettings.security.sessionExpiration} minutes`} />
                    </div>
                    <div className="flex items-center gap-2 py-2">
                      <span className={`w-2 h-2 rounded-full ${savedSettings.security.twoFactorAuth ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm text-gray-700">Authentification 2FA : <strong>{savedSettings.security.twoFactorAuth ? 'Activée' : 'Désactivée'}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useStore } from '../../store';
import { User, Mail, Phone, Lock, Save, MapPin, CheckCircle2 } from 'lucide-react';

export function ProfProfile() {
  const currentUser = useStore(state => state.currentUser);
  const professors = useStore(state => state.professors);
  const updateProfessor = useStore(state => state.updateProfessor);
  const updateUser = useStore(state => state.updateUser);
  const settings = useStore(state => state.settings);

  const professor = professors.find(p => p.userId === currentUser?.id);

  const [formData, setFormData] = useState({
    phone: professor?.phone || '',
    email: professor?.email || '',
    address: professor?.address || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isSaved, setIsSaved] = useState(false);

  if (!professor || !currentUser) {
    return <div>Profil professeur introuvable.</div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update professor details
    updateProfessor(professor.id, {
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
    });

    // Update user login email if changed
    if (formData.email !== currentUser.email) {
      updateUser(currentUser.id, { email: formData.email });
    }

    // Handle password change
    if (formData.newPassword && formData.newPassword === formData.confirmPassword) {
      // In a real app, we would verify currentPassword first
      updateUser(currentUser.id, { password: formData.newPassword });
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    }

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mon Profil</h2>
        <p className="text-gray-500 mt-1">Gérez vos informations personnelles et paramètres de sécurité</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Non-editable info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 text-center border-b border-gray-200">
              <div className="w-24 h-24 mx-auto bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-3xl font-bold mb-4">
                {professor.firstName.charAt(0)}{professor.lastName.charAt(0)}
              </div>
              <h3 className="text-xl font-bold text-gray-900">{professor.firstName} {professor.lastName}</h3>
              <p className="text-sm text-gray-500">{professor.specialty}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Informations contrat</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Type</span>
                  <span className="font-medium text-gray-900">{professor.contractType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Taux horaire</span>
                  <span className="font-medium text-gray-900">{professor.hourlyRate} {settings.currency}/h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date d'embauche</span>
                  <span className="font-medium text-gray-900">
                    {new Date(professor.hireDate).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-500 text-center">
                Ces informations ne peuvent être modifiées que par l'administration.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editable info */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Informations de contact</h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse postale</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Sécurité</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      value={formData.currentPassword}
                      onChange={e => setFormData({...formData, currentPassword: e.target.value})}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Laissez vide pour ne pas modifier"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                    <input
                      type="password"
                      value={formData.newPassword}
                      onChange={e => setFormData({...formData, newPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-between">
              {isSaved ? (
                <span className="text-emerald-600 text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Modifications enregistrées
                </span>
              ) : (
                <span className="text-gray-500 text-sm">
                  N'oubliez pas de sauvegarder vos modifications
                </span>
              )}
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Save className="w-5 h-5" />
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

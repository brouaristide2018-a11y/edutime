import React, { useState } from 'react';
import { Building2, User, Mail, Phone, MapPin, Lock, Eye, EyeOff, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';

const DRENA_LIST = [
  "Abidjan 1", "Abidjan 2", "Abidjan 3", "Abidjan 4",
  "Aboisso", "Adzopé", "Agboville", "Bondoukou", "Bongouanou",
  "Bouaflé", "Bouaké 1", "Bouaké 2", "Bouna", "Boundiali",
  "Daloa", "Daoukro", "Dimbokro", "Divo", "Duékoué",
  "Ferkessédougou", "Gagnoa", "Guiglo", "Katiola", "Korhogo",
  "Mankono", "Minignan", "Odienné", "San-Pédro", "Sassandra",
  "Séguéla", "Soubré", "Touba", "Yamoussoukro"
];

export function RegisterForm({ onSubmit, onCancel, isLoading, error }: any) {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    // 1. Etablissement
    codeEtablissement: '',
    nomEtablissement: '',
    emailEtablissement: '',
    drena: '',
    adresse: '',
    ville: '',
    etablissementContact1: '',
    etablissementContact2: '',
    etablissementContact3: '',
    
    // 2. Fondateur
    fondateurNom: '',
    fondateurPrenom: '',
    fondateurSexe: 'M',
    fondateurEmail: '',
    fondateurResidence: '',
    fondateurContact1: '',
    fondateurContact2: '',
    fondateurContact3: '',

    // 3. Directeur
    directeurNom: '',
    directeurPrenom: '',
    directeurSexe: 'M',
    directeurEmail: '',
    directeurResidence: '',
    directeurContact1: '',
    directeurContact2: '',
    directeurContact3: '',

    // 4. Correspondant
    correspondantNom: '',
    correspondantPrenom: '',
    correspondantSexe: 'M',
    correspondantEmail: '',
    correspondantResidence: '',
    correspondantContact1: '',
    correspondantContact2: '',
    correspondantContact3: '',

    // 5. Configuration
    cycle: '1er Cycle Uniquement',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 5));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 5) {
      nextStep();
    } else {
      onSubmit(formData);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 z-0"></div>
        <div 
          className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-indigo-600 z-0 transition-all duration-300" 
          style={{ width: `${((step - 1) / 4) * 100}%` }}
        ></div>
        
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${step >= i ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-500'}`}>
            {step > i ? <CheckCircle className="w-5 h-5" /> : i}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[10px] sm:text-xs font-medium text-gray-500">
        <span className="text-center w-12 sm:w-16">École</span>
        <span className="text-center w-12 sm:w-16">Fondateur</span>
        <span className="text-center w-12 sm:w-16">Directeur</span>
        <span className="text-center w-12 sm:w-16">Corresp.</span>
        <span className="text-center w-12 sm:w-16">Config</span>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {renderStepIndicator()}

      {step === 1 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">1. Informations Établissement</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Code Établissement</label>
              <input type="text" name="codeEtablissement" required value={formData.codeEtablissement} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom Établissement</label>
              <input type="text" name="nomEtablissement" required value={formData.nomEtablissement} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Établissement</label>
              <input type="email" name="emailEtablissement" required value={formData.emailEtablissement} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">DRENA-ET</label>
              <select name="drena" required value={formData.drena} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border">
                <option value="">Sélectionner une DRENA</option>
                {DRENA_LIST.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Adresse Établissement</label>
              <input type="text" name="adresse" required value={formData.adresse} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ville</label>
              <input type="text" name="ville" required value={formData.ville} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact 1</label>
              <input type="text" name="etablissementContact1" required value={formData.etablissementContact1} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact 2 (Optionnel)</label>
              <input type="text" name="etablissementContact2" value={formData.etablissementContact2} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact 3 (Optionnel)</label>
              <input type="text" name="etablissementContact3" value={formData.etablissementContact3} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">2. Informations Fondateur</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom</label>
              <input type="text" name="fondateurNom" required value={formData.fondateurNom} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Prénom</label>
              <input type="text" name="fondateurPrenom" required value={formData.fondateurPrenom} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Sexe</label>
              <select name="fondateurSexe" value={formData.fondateurSexe} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border">
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" name="fondateurEmail" required value={formData.fondateurEmail} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Lieu de Résidence</label>
              <input type="text" name="fondateurResidence" required value={formData.fondateurResidence} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact 1</label>
              <input type="text" name="fondateurContact1" required value={formData.fondateurContact1} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact 2 (Optionnel)</label>
              <input type="text" name="fondateurContact2" value={formData.fondateurContact2} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact 3 (Optionnel)</label>
              <input type="text" name="fondateurContact3" value={formData.fondateurContact3} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">3. Informations Directeur/Directrice</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom</label>
              <input type="text" name="directeurNom" required value={formData.directeurNom} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Prénom</label>
              <input type="text" name="directeurPrenom" required value={formData.directeurPrenom} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Sexe</label>
              <select name="directeurSexe" value={formData.directeurSexe} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border">
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" name="directeurEmail" required value={formData.directeurEmail} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Lieu de Résidence</label>
              <input type="text" name="directeurResidence" required value={formData.directeurResidence} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact 1</label>
              <input type="text" name="directeurContact1" required value={formData.directeurContact1} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact 2 (Optionnel)</label>
              <input type="text" name="directeurContact2" value={formData.directeurContact2} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact 3 (Optionnel)</label>
              <input type="text" name="directeurContact3" value={formData.directeurContact3} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">4. Informations Correspondant Fichier</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom</label>
              <input type="text" name="correspondantNom" required value={formData.correspondantNom} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Prénom</label>
              <input type="text" name="correspondantPrenom" required value={formData.correspondantPrenom} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Sexe</label>
              <select name="correspondantSexe" value={formData.correspondantSexe} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border">
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" name="correspondantEmail" required value={formData.correspondantEmail} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Lieu de Résidence</label>
              <input type="text" name="correspondantResidence" required value={formData.correspondantResidence} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact 1</label>
              <input type="text" name="correspondantContact1" required value={formData.correspondantContact1} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact 2 (Optionnel)</label>
              <input type="text" name="correspondantContact2" value={formData.correspondantContact2} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact 3 (Optionnel)</label>
              <input type="text" name="correspondantContact3" value={formData.correspondantContact3} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">5. Configuration & Compte</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cycles d'enseignement</label>
              <div className="space-y-2">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input 
                    type="radio" 
                    name="cycle" 
                    value="1er Cycle Uniquement" 
                    checked={formData.cycle === '1er Cycle Uniquement'} 
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300" 
                  />
                  <span className="ml-3 block">
                    <span className="block text-sm font-medium text-gray-900">1er Cycle Uniquement</span>
                    <span className="block text-sm text-gray-500">De la 6ème à la 3ème uniquement</span>
                  </span>
                </label>
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input 
                    type="radio" 
                    name="cycle" 
                    value="1er Cycle & 2nd Cycle" 
                    checked={formData.cycle === '1er Cycle & 2nd Cycle'} 
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300" 
                  />
                  <span className="ml-3 block">
                    <span className="block text-sm font-medium text-gray-900">1er Cycle & 2nd Cycle</span>
                    <span className="block text-sm text-gray-500">De la 6ème à la Terminale</span>
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-4">
                Le compte administrateur sera créé avec l'email de <strong>l'Établissement</strong> ({formData.emailEtablissement || 'non renseigné'}).<br/>
                Vous utiliserez cet email ou le code de l'établissement pour vous connecter.
              </p>
              <label className="block text-sm font-medium text-gray-700">
                Mot de passe administrateur
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
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
              <p className="text-xs text-gray-500 mt-2">Le mot de passe doit contenir au moins 6 caractères.</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        {step > 1 ? (
          <button
            type="button"
            onClick={prevStep}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Précédent
          </button>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 focus:outline-none"
          >
            Annuler
          </button>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {step < 5 ? (
            <>
              Suivant
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          ) : (
            isLoading ? 'Création...' : 'Terminer l\'inscription'
          )}
        </button>
      </div>
    </form>
  );
}

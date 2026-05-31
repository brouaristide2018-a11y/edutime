import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Edit2, Trash2, CheckCircle, X, Save } from 'lucide-react';
import { ConfirmModal } from '../../components/ConfirmModal';
import { compressImage } from '../../utils/image';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  status: 'active' | 'inactive';
  paymentLink?: string;
  paymentQrCode?: string;
}

export function SuperAdminSubscriptions() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<SubscriptionPlan, 'id'>>({
    name: '',
    price: 0,
    billingCycle: 'monthly',
    features: [''],
    status: 'active',
    paymentLink: '',
    paymentQrCode: ''
  });

  const fetchPlans = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'subscription_plans'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionPlan));
      setPlans(data);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenModal = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        price: plan.price,
        billingCycle: plan.billingCycle,
        features: [...plan.features],
        status: plan.status,
        paymentLink: plan.paymentLink || '',
        paymentQrCode: plan.paymentQrCode || ''
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        price: 0,
        billingCycle: 'monthly',
        features: [''],
        status: 'active',
        paymentLink: '',
        paymentQrCode: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const planData = {
        ...formData,
        features: formData.features.filter(f => f.trim() !== '')
      };

      if (editingPlan) {
        await setDoc(doc(db, 'subscription_plans', editingPlan.id), planData);
      } else {
        await addDoc(collection(db, 'subscription_plans'), planData);
      }
      
      handleCloseModal();
      fetchPlans();
    } catch (error) {
      console.error("Error saving plan:", error);
      alert("Erreur lors de l'enregistrement du plan");
    }
  };

  const handleDelete = async () => {
    if (!planToDelete) return;
    try {
      await deleteDoc(doc(db, 'subscription_plans', planToDelete));
      fetchPlans();
    } catch (error) {
      console.error("Error deleting plan:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setPlanToDelete(null);
    }
  };

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Abonnements</h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          Créer un plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className={`bg-white rounded-xl shadow-sm border ${plan.status === 'active' ? 'border-indigo-200' : 'border-gray-200'} overflow-hidden flex flex-col`}>
            <div className={`p-6 border-b ${plan.status === 'active' ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${plan.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {plan.status === 'active' ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-gray-900">{plan.price.toLocaleString()} FCFA</span>
                <span className="text-gray-500 font-medium">/{plan.billingCycle === 'monthly' ? 'mois' : 'an'}</span>
              </div>
            </div>
            
            <div className="p-6 flex-1">
              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                onClick={() => handleOpenModal(plan)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <Edit2 size={18} />
                Modifier le Plan
              </button>
              <button
                onClick={() => setPlanToDelete(plan.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                title="Supprimer"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
        
        {plans.length === 0 && (
          <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500 mb-4">Aucun plan d'abonnement n'a été créé.</p>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={20} />
              Créer le premier plan
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingPlan ? 'Modifier le plan' : 'Créer un nouveau plan'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="plan-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du plan</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="ex: Premium"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix (FCFA)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cycle de facturation</label>
                    <select
                      value={formData.billingCycle}
                      onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as 'monthly' | 'yearly' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="monthly">Mensuel</option>
                      <option value="yearly">Annuel</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Fonctionnalités</label>
                    <button
                      type="button"
                      onClick={addFeature}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                    >
                      <Plus size={16} /> Ajouter
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={feature}
                          onChange={(e) => handleFeatureChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="ex: Jusqu'à 100 élèves"
                        />
                        {formData.features.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFeature(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informations de Paiement</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lien de Paiement (Optionnel)</label>
                      <input
                        type="url"
                        value={formData.paymentLink}
                        onChange={(e) => setFormData({ ...formData, paymentLink: e.target.value })}
                        placeholder="https://pay.example.com/plan"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">Lien direct vers la page de paiement (Wave, Mobile Money, Stripe, etc.)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">QR Code de Paiement (Image ou URL)</label>
                      <div className="flex flex-col gap-4">
                        <input
                          type="url"
                          value={formData.paymentQrCode}
                          onChange={(e) => setFormData({ ...formData, paymentQrCode: e.target.value })}
                          placeholder="https://example.com/qrcode.png"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Plus className="w-8 h-8 mb-3 text-gray-400" />
                              <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Cliquez pour charger</span> ou glissez une image</p>
                              <p className="text-xs text-gray-500">PNG, JPG, SVG (Max 1Mo)</p>
                            </div>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 2 * 1024 * 1024) {
                                    alert("L'image est trop grande. Veuillez choisir une image de moins de 2Mo.");
                                    return;
                                  }
                                  try {
                                    const compressedDataUrl = await compressImage(file, 512, 512);
                                    setFormData({ ...formData, paymentQrCode: compressedDataUrl });
                                  } catch (error) {
                                    console.error('Error compressing image:', error);
                                    alert("Une erreur s'est produite lors de la compression de l'image.");
                                  }
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">Insérez l'URL ou chargez directement l'image de votre QR code de paiement spécifique à ce plan.</p>
                      {formData.paymentQrCode && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg flex justify-center border border-dashed border-gray-300 relative">
                          <button 
                            type="button"
                            onClick={() => setFormData({ ...formData, paymentQrCode: '' })}
                            className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                            title="Supprimer l'image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <img src={formData.paymentQrCode} alt="QR Code Preview" className="max-h-48 object-contain" referrerPolicy="no-referrer" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-gray-200 mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <Save size={20} />
                    {editingPlan ? 'Mettre à jour' : 'Créer le plan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!planToDelete}
        onClose={() => setPlanToDelete(null)}
        onConfirm={handleDelete}
        title="Supprimer le plan"
        message="Êtes-vous sûr de vouloir supprimer ce plan d'abonnement ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
      />
    </div>
  );
}

import React, { useState } from 'react';
import { useStore } from '../../store';
import { CreditCard, CheckCircle, Clock, AlertCircle, ExternalLink, QrCode, MessageCircle } from 'lucide-react';

export function Subscription() {
  const currentUser = useStore(state => state.currentUser);
  const platformSettings = useStore(state => state.platformSettings);
  const schoolSubscription = useStore(state => state.schoolSubscription);
  const addSubscription = useStore(state => state.addSubscription);
  const updateSubscription = useStore(state => state.updateSubscription);
  const subscriptions = useStore(state => state.subscriptions);

  const [submitting, setSubmitting] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');
  const [success, setSuccess] = useState(false);

  // Get subscription for this school
  const subscription = currentUser?.schoolId
    ? subscriptions.find((s: any) => s.id === currentUser.schoolId) || schoolSubscription
    : null;

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentRef || !currentUser?.schoolId) return;

    setSubmitting(true);
    try {
      const subData = {
        id: currentUser.schoolId,
        schoolId: currentUser.schoolId,
        schoolName: currentUser.name,
        status: 'awaiting_approval',
        paymentReference: paymentRef,
        updatedAt: new Date().toISOString()
      };

      const existingSub = subscriptions.find((s: any) => s.id === currentUser.schoolId);
      if (existingSub) {
        updateSubscription(currentUser.schoolId, subData);
      } else {
        addSubscription(subData);
      }

      setSuccess(true);
      setPaymentRef('');
    } catch (error) {
      console.error("Error submitting payment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Abonnement & Facturation</h1>
          <p className="text-gray-500">Gérez l'accès de votre établissement à EduTime</p>
        </div>
        <div className={`px-4 py-2 rounded-lg flex items-center gap-2 border ${
          (subscription as any)?.status === 'active'
            ? 'bg-green-50 border-green-200 text-green-700'
            : (subscription as any)?.status === 'awaiting_approval'
            ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {(subscription as any)?.status === 'active' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          <span className="font-semibold capitalize">
            {(subscription as any)?.status === 'active' ? 'Activé' :
             (subscription as any)?.status === 'awaiting_approval' ? 'En attente de validation' : 'Non payé'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Instructions de paiement */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              Effectuer un paiement
            </h2>

            <p className="text-gray-600 mb-6 font-medium">
              Veuillez utiliser l'un des moyens de paiement ci-dessous pour activer votre abonnement annuel.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                  <h3 className="font-medium text-indigo-900 mb-2">Paiement Mobile</h3>
                  <p className="text-sm text-indigo-700 mb-4">Cliquez sur le lien ci-dessous pour payer via Mobile Money ou Carte.</p>
                  {platformSettings?.paymentLink ? (
                    <a
                      href={platformSettings.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      Payer en ligne
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Lien non configuré.</p>
                  )}
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-2">Besoin d'aide ?</h3>
                  <p className="text-sm text-gray-600 mb-3">Contactez notre support technique pour toute question.</p>
                  <a
                    href={`https://wa.me/${platformSettings?.supportContact?.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Support WhatsApp
                  </a>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="mb-3 text-sm font-medium text-gray-700 flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  Scanner pour payer
                </div>
                {platformSettings?.paymentQrCode ? (
                  <img
                    src={platformSettings.paymentQrCode}
                    alt="Payment QR Code"
                    className="w-48 h-48 object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-100 flex items-center justify-center rounded border border-dashed border-gray-300">
                    <QrCode className="w-12 h-12 text-gray-300" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Formulaire de confirmation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-indigo-600" />
              Confirmation de paiement
            </h2>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <p className="text-sm text-gray-600">
                Une fois le paiement effectué, veuillez saisir la référence de la transaction ci-dessous pour validation par le Super Administrateur.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Référence du paiement</label>
                <input
                  type="text"
                  required
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="Ex: MM-12345678 ou Réf. Virement"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10 px-3 border"
                />
              </div>

              {success && (
                <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Demande envoyée avec succès ! Votre compte sera activé après vérification.
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !paymentRef}
                className="w-full inline-flex items-center justify-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {submitting ? 'Envoi...' : 'Confirmer mon paiement'}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-xl shadow-md p-6 text-white">
            <h3 className="text-lg font-bold mb-2">Offre Annuelle EduTime</h3>
            <div className="text-3xl font-bold mb-4">50 000 FCFA <span className="text-sm font-normal text-indigo-100">/ an</span></div>
            <ul className="space-y-3 mb-6 text-indigo-50">
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4" /> Utilisateurs Illimités
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4" /> Pointage QR Code & Géoloc
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4" /> Gestion automatisée des paies
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4" /> Multi-établissements
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4" /> Support Prioritaire 24/7
              </li>
            </ul>
            <div className="pt-4 border-t border-indigo-500 text-xs text-indigo-100 text-center">
              Abonnement renouvelable annuellement
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Note Importante
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Après la validation de votre paiement par le Super Administrateur, votre établissement pourra jouir de toutes les fonctionnalités de la plateforme EduTime.
              Le processus de validation prend généralement moins de 2 heures.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

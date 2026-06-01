import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Clock, Megaphone, Info, CreditCard } from 'lucide-react';
import type { SubscriptionPlan, Announcement } from '../store';

export function AdminHome() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showPlansModal, setShowPlansModal] = useState(false);

  const allAnnouncements = useStore(state => state.announcements);
  const subscriptionPlans = useStore(state => state.subscriptionPlans);

  // Active announcements visible to admin
  const announcements: Announcement[] = allAnnouncements.filter(a => a.status === 'active');

  // Active subscription plans
  const plans: SubscriptionPlan[] = subscriptionPlans.filter(p => p.status === 'active');

  // Clock Update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Clock Section */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 sm:p-6 shadow-sm text-white flex flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 hidden sm:block">
            <Clock size={120} />
          </div>
          <div className="relative z-10 text-center space-y-1 sm:space-y-2">
            <p className="text-indigo-100 font-medium capitalize text-sm sm:text-lg">{formatDate(currentTime)}</p>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-widest font-mono">
              {formatTime(currentTime)}
            </h2>
          </div>
        </div>

        {/* Subscriptions Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CreditCard size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Abonnements</h2>
            </div>
            <p className="text-gray-500 text-sm">Consultez nos différentes offres, renouvelez votre abonnement ou vérifiez ses détails actuels.</p>
          </div>
          <button
            onClick={() => setShowPlansModal(true)}
            className="mt-6 w-full py-2.5 px-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
          >
            Voir les Plans
          </button>
        </div>

        {/* Support/Info Quick Link */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <Info size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Assistance / Info</h2>
            </div>
            <p className="text-gray-500 text-sm">Besoin d'aide avec la plateforme ? Notre équipe est prête à vous accompagner.</p>
          </div>
          <a
            href="/admin/support"
            className="mt-6 block text-center w-full py-2.5 px-4 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            Contacter le Support
          </a>
        </div>
      </div>

      {/* Announcements Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Megaphone className="text-indigo-600" size={24} />
          Annonces & Pubs
        </h2>

        {announcements.length === 0 ? (
          <p className="text-gray-500 text-center py-8 italic bg-gray-50 rounded-xl">Aucune annonce pour le moment.</p>
        ) : (
          <div className="space-y-4">
            {announcements.map(ann => (
              <div key={ann.id} className={`p-5 rounded-xl border ${ann.type === 'ad' ? 'bg-amber-50/50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded-md text-xs font-semibold ${ann.type === 'ad' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>
                    {ann.type === 'ad' ? 'Publicité' : 'Annonce'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(ann.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{ann.title}</h3>
                <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{ann.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plans Modal */}
      {showPlansModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-200 p-6 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold text-gray-900">Nos Plans d'Abonnement</h2>
              <button
                onClick={() => setShowPlansModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                &times;
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-gray-500">
                    Aucun plan n'est disponible pour le moment.
                  </div>
                ) : (
                  plans.map(plan => (
                    <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow">
                      <div className="border-b border-gray-100 pb-4 mb-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold text-indigo-600">{plan.price.toLocaleString()}</span>
                          <span className="text-sm text-gray-500 font-medium">FCFA / {plan.billingCycle === 'monthly' ? 'mois' : 'an'}</span>
                        </div>
                      </div>

                      <ul className="space-y-3 flex-1 mb-6">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex gap-2 text-sm text-gray-600">
                            <span className="text-indigo-500">&#10003;</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                        <h4 className="text-sm font-semibold text-gray-900 text-center">Moyens de paiement</h4>
                        {plan.paymentLink && (
                          <a
                            href={plan.paymentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-center rounded-lg text-sm font-medium transition-colors"
                          >
                            Payer en ligne
                          </a>
                        )}
                        {plan.paymentQrCode && (
                          <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                            <p className="text-xs text-gray-500 mb-2">Scanner le QR Code</p>
                            <img src={plan.paymentQrCode} alt="QR Code Paiement" className="w-full h-auto max-w-[150px] mx-auto object-contain" />
                          </div>
                        )}
                        {!plan.paymentLink && !plan.paymentQrCode && (
                          <p className="text-xs text-gray-500 text-center italic">Veuillez contacter le support pour le paiement.</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

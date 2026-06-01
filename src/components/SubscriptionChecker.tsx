import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { differenceInDays, parseISO } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function SubscriptionChecker({ children }: { children: React.ReactNode }) {
  const { settings, currentUser, updateUser, updateSettings, updateRegistration, logout } = useStore();
  const navigate = useNavigate();
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    const checkSubscription = async () => {
      if (!currentUser || currentUser.role === 'SuperAdmin') return;
      if (!settings?.subscription) return;

      const { status, trialEndDate, plan } = settings.subscription;

      if (status === 'Suspendu') {
        alert("Oups ! Le compte de l'établissement a été suspendu suite à un non paiement ou administration. Vous allez être déconnecté.");
        logout();
        navigate('/login');
        return;
      }

      if (plan !== 'Essai') return;

      let endDate: Date;
      try {
        endDate = parseISO(trialEndDate);
      } catch (e) {
        return;
      }

      const daysDiff = differenceInDays(endDate, new Date());

      if (daysDiff < -3) {
        // Suspendre automatiquement
        updateUser(currentUser.id, { status: 'Suspendu' });
        if (currentUser.schoolId) {
          updateSettings({ subscription: { ...settings.subscription, status: 'Suspendu' } });
          if (currentUser.role === 'Admin') {
            // Find and update registration
            const registrations = useStore.getState().registrations;
            const reg = registrations.find(r => r.emailEtablissement === currentUser.email);
            if (reg) updateRegistration(reg.id, { status: 'Suspendu' });
          }
        }
        alert("Alerte: Votre période d'essai est terminée depuis plus de 3 jours. Votre compte a été suspendu. Veuillez contacter l'administration pour régulariser votre situation.");
        logout();
        navigate('/login');
      } else if (daysDiff < 0) {
        setWarningMessage(`Votre période d'essai est terminée. Votre compte sera suspendu dans ${3 + daysDiff} jour(s). Veuillez passer à un plan d'abonnement immédiatement.`);
        if (currentUser.schoolId && status !== 'Suspension Imminente') {
          updateSettings({ subscription: { ...settings.subscription, status: 'Suspension Imminente' } });
        }
      } else if (daysDiff <= 5) {
        setWarningMessage(`Votre période d'essai se termine dans ${daysDiff} jour(s). Pensez à choisir un plan d'abonnement pour continuer à utiliser EduTime.`);
      }
    };

    checkSubscription();
  }, [settings?.subscription, currentUser, navigate]);

  return (
    <>
      {warningMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 sticky top-0 z-50 flex items-start gap-3 shadow-md">
          <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-red-800 font-semibold mb-1">Attention relative à votre abonnement</h3>
            <p className="text-sm text-red-700">{warningMessage}</p>
          </div>
          {currentUser?.role === 'Admin' && (
            <button onClick={() => navigate('/admin/support')} className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded uppercase tracking-wider font-semibold shadow flex-shrink-0">
              Contacter le support
            </button>
          )}
        </div>
      )}
      {children}
    </>
  );
}

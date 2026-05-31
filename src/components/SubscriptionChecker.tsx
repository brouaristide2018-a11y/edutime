import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { differenceInDays, parseISO } from 'date-fns';
import { AlertTriangle, Lock } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

export function SubscriptionChecker({ children }: { children: React.ReactNode }) {
  const { settings, currentUser } = useStore();
  const navigate = useNavigate();
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    const checkSubscription = async () => {
      if (!currentUser || currentUser.role === 'SuperAdmin') return;
      if (!settings?.subscription) return;

      const { status, trialEndDate, plan } = settings.subscription;
      
      if (status === 'Suspendu') {
         alert("Oups ! Le compte de l'établissement a été suspendu suite à un non paiement ou administration. Vous allez être déconnecté.");
         auth.signOut();
         navigate('/login');
         return;
      }

      // Si le plan est actif et pas en essai, pas de vérification d'essai
      if (plan !== 'Essai') return;

      let endDate: Date;
      try {
        endDate = parseISO(trialEndDate);
      } catch (e) {
        return;
      }

      const daysDiff = differenceInDays(endDate, new Date()); // + si on est avant la fin, - si on a dépassé

      if (daysDiff < -3) {
        // Période de grâce de 3 jours écoulée => SUSPENDRE Automatiquement
        try {
          // Suspendre d'abord le compte utilisateur
          await updateDoc(doc(db, 'users', currentUser.id), { status: 'Suspendu' });
          // Suspendre l'établissement (settings & registration si on les a)
          if (currentUser.schoolId) {
            await updateDoc(doc(db, 'settings', currentUser.schoolId), {
              'subscription.status': 'Suspendu'
            });
            if (currentUser.role === 'Admin') {
                await updateDoc(doc(db, 'registrations', currentUser.email), { status: 'Suspendu' });
            }
          }
          alert("Alerte: Votre période d'essai est terminée depuis plus de 3 jours. Votre compte a été suspendu. Veuillez contacter l'administration pour régulariser votre situation.");
          auth.signOut();
          navigate('/login');
        } catch (error) {
          console.error("Error suspending account auto:", error);
        }
      } else if (daysDiff < 0) {
        // En période de grâce (entre 0 et -3 jours)
        setWarningMessage(`Votre période d'essai est terminée. Votre compte sera suspendu dans ${3 + daysDiff} jour(s). Veuillez passer à un plan d'abonnement immédiatement.`);
        if (currentUser.schoolId && status !== 'Suspension Imminente') {
          // Mise à jour du statut pour refléter la suspension imminente
          updateDoc(doc(db, 'settings', currentUser.schoolId), {
            'subscription.status': 'Suspension Imminente'
          }).catch(console.error);
        }
      } else if (daysDiff <= 5) {
        // Alerte si la fin approche
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

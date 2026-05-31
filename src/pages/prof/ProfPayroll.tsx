import React, { useState } from 'react';
import { useStore } from '../../store';
import { Banknote, Download, FileText, ChevronRight, Calculator, CheckCircle, X, Printer } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ConfirmModal } from '../../components/ConfirmModal';

export function ProfPayroll() {
  const currentUser = useStore(state => state.currentUser);
  const professors = useStore(state => state.professors);
  const attendances = useStore(state => state.attendances);
  const payments = useStore(state => state.payments);
  const settings = useStore(state => state.settings);
  const updatePayment = useStore(state => state.updatePayment);

  const [payslipModalOpen, setPayslipModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [paymentToApprove, setPaymentToApprove] = useState<any>(null);

  const professor = professors.find(p => p.userId === currentUser?.id);

  if (!professor) {
    return <div>Profil professeur introuvable.</div>;
  }

  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);

  // Calculate current month's estimated pay
  const monthAttendances = attendances.filter(a => {
    const date = parseISO(a.date);
    return a.professorId === professor.id && 
           isWithinInterval(date, { start: currentMonthStart, end: currentMonthEnd });
  });

  const regularHours = monthAttendances
    .filter(a => a.status === 'present' || a.status === 'retard')
    .reduce((total, a) => total + a.calculatedHours, 0);

  const overtimeHours = monthAttendances
    .filter(a => a.status === 'remplacement') // Assuming 'remplacement' or another status for overtime, adjust if needed
    .reduce((total, a) => total + a.calculatedHours, 0);

  const baseSalary = regularHours * professor.hourlyRate;
  const overtimeRate = professor.hourlyRate * (settings.overtimeCoefficient || 1.25);
  const overtimePay = overtimeHours * overtimeRate;
  const estimatedTotal = baseSalary + overtimePay;

  // Get past payments
  const pastPayments = payments
    .filter(p => p.professorId === professor.id)
    .sort((a, b) => new Date(b.month + '-01').getTime() - new Date(a.month + '-01').getTime());

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Ma Paie</h2>
        <p className="text-gray-500 mt-1">Suivez vos revenus et téléchargez vos fiches de paie</p>
      </div>

      {/* Current Month Estimate */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Estimation du mois en cours</h3>
                <p className="text-sm text-gray-500 capitalize">{format(now, 'MMMM yyyy', { locale: fr })}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-600">
                {estimatedTotal.toLocaleString()} {settings.currency}
              </div>
              <p className="text-sm text-gray-500">Total estimé</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-500">Heures normales</div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-gray-900">{regularHours}h</span>
              <span className="text-sm text-gray-500">× {professor.hourlyRate} {settings.currency}</span>
            </div>
            <div className="text-sm font-medium text-gray-900 pt-2 border-t border-gray-100">
              = {baseSalary.toLocaleString()} {settings.currency}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-500">Heures supplémentaires</div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-gray-900">{overtimeHours}h</span>
              <span className="text-sm text-gray-500">× {overtimeRate} {settings.currency}</span>
            </div>
            <div className="text-sm font-medium text-gray-900 pt-2 border-t border-gray-100">
              = {overtimePay.toLocaleString()} {settings.currency}
            </div>
          </div>

          <div className="space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div className="text-sm font-medium text-gray-500">Informations contrat</div>
            <div className="space-y-1 mt-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Type :</span>
                <span className="font-medium text-gray-900">{professor.contractType}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Taux horaire :</span>
                <span className="font-medium text-gray-900">{professor.hourlyRate} {settings.currency}/h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Historique des paiements</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Période</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date de paiement</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Montant</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Document</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pastPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Aucun historique de paiement disponible.
                  </td>
                </tr>
              ) : (
                pastPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {format(parseISO(payment.month + '-01'), 'MMMM yyyy', { locale: fr })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {payment.month}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {payment.month}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">
                        {payment.amount.toLocaleString()} {settings.currency}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        payment.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                        payment.status === 'awaiting_approval' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {payment.status === 'paid' ? 'Payé' : 
                         payment.status === 'awaiting_approval' ? 'En attente de votre approbation' : 
                         'En attente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {payment.status === 'awaiting_approval' && (
                          <button 
                            onClick={() => setPaymentToApprove(payment)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approuver la réception
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setSelectedPayment(payment);
                            setPayslipModalOpen(true);
                          }}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {payslipModalOpen && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Fiche de paie - {professor.firstName} {professor.lastName}
              </h2>
              <button
                onClick={() => setPayslipModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="relative border border-gray-200 p-8 rounded-lg space-y-6 bg-white" id="payslip-content">
                {/* Watermark Logo */}
                {settings?.logo && (
                  <img 
                    src={settings.logo} 
                    alt="" 
                    className="payslip-watermark" 
                    referrerPolicy="no-referrer"
                  />
                )}

                <div className="payslip-content-wrapper space-y-6">
                  <div className="flex justify-between items-start border-b border-gray-200 pb-6">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">FICHE DE PAIE</h1>
                      <p className="text-gray-500 mt-1">Mois: {format(parseISO(selectedPayment.month + '-01'), 'MMMM yyyy', { locale: fr })}</p>
                    </div>
                    <div className="text-right">
                      <h3 className="font-bold text-gray-900">{settings?.schoolName || 'Nom de l\'école'}</h3>
                      <p className="text-sm text-gray-500">Année scolaire {settings?.schoolYear || '2023-2024'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Informations Professeur</h4>
                      <div className="space-y-1">
                        <p><span className="text-gray-500">Nom:</span> <span className="font-medium">{professor.lastName}</span></p>
                        <p><span className="text-gray-500">Prénoms:</span> <span className="font-medium">{professor.firstName}</span></p>
                        <p><span className="text-gray-500">Spécialité:</span> <span className="font-medium">{professor.specialty}</span></p>
                        <p><span className="text-gray-500">Taux horaire:</span> <span className="font-medium">{professor.hourlyRate?.toLocaleString()} {settings?.currency || 'CFA'}</span></p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Détails du paiement</h4>
                      <div className="space-y-1">
                        <p><span className="text-gray-500">Statut:</span> <span className="font-medium">{selectedPayment.status === 'paid' ? 'Payé' : selectedPayment.status === 'awaiting_approval' ? 'En attente d\'approbation' : 'En attente'}</span></p>
                        {selectedPayment.paidAt && (
                          <p><span className="text-gray-500">Date:</span> <span className="font-medium">{format(new Date(selectedPayment.paidAt), 'dd/MM/yyyy')}</span></p>
                        )}
                        {selectedPayment.paymentMethod && (
                          <p><span className="text-gray-500">Méthode:</span> <span className="font-medium">{selectedPayment.paymentMethod}</span></p>
                        )}
                      </div>
                    </div>
                  </div>

                  <table className="w-full text-left border-collapse mt-6">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="py-2 text-sm font-bold text-gray-700">Désignation</th>
                        <th className="py-2 text-sm font-bold text-gray-700 text-right">Heures</th>
                        <th className="py-2 text-sm font-bold text-gray-700 text-right">Taux</th>
                        <th className="py-2 text-sm font-bold text-gray-700 text-right">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="py-3 text-sm text-gray-900">Heures normales</td>
                        <td className="py-3 text-sm text-gray-900 text-right">{selectedPayment.normalHours?.toFixed(1) || selectedPayment.hours?.toFixed(1)}</td>
                        <td className="py-3 text-sm text-gray-900 text-right">{professor.hourlyRate?.toLocaleString()}</td>
                        <td className="py-3 text-sm text-gray-900 text-right">{((selectedPayment.normalHours || selectedPayment.hours || 0) * (professor.hourlyRate || 0)).toLocaleString()}</td>
                      </tr>
                      {(selectedPayment.overtimeHours || 0) > 0 && (
                        <tr>
                          <td className="py-3 text-sm text-gray-900">Heures supplémentaires</td>
                          <td className="py-3 text-sm text-gray-900 text-right">{selectedPayment.overtimeHours.toFixed(1)}</td>
                          <td className="py-3 text-sm text-gray-900 text-right">{((professor.hourlyRate || 0) * (settings?.overtimeCoefficient || 1.25)).toLocaleString()}</td>
                          <td className="py-3 text-sm text-gray-900 text-right">{(selectedPayment.overtimeHours * (professor.hourlyRate || 0) * (settings?.overtimeCoefficient || 1.25)).toLocaleString()}</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-300">
                        <td colSpan={3} className="py-4 text-right font-bold text-gray-900">NET À PAYER</td>
                        <td className="py-4 text-right font-bold text-xl text-indigo-600">{selectedPayment.amount.toLocaleString()} {settings?.currency || 'CFA'}</td>
                      </tr>
                    </tfoot>
                  </table>

                  <div className="mt-12 flex justify-between pt-8 border-t border-gray-200">
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-900 mb-8">Signature de l'employeur</p>
                      <p className="text-xs text-gray-500">Cachet et signature</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-900 mb-8">Signature de l'employé</p>
                      <p className="text-xs text-gray-500">Précédée de la mention "Lu et approuvé"</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setPayslipModalOpen(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Imprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!paymentToApprove}
        onClose={() => setPaymentToApprove(null)}
        onConfirm={() => {
          if (paymentToApprove) {
            updatePayment(paymentToApprove.id, { status: 'paid' });
            setPaymentToApprove(null);
          }
        }}
        title="Approuver la réception"
        message="Confirmez-vous avoir reçu ce paiement ?"
        confirmText="Confirmer"
        cancelText="Annuler"
      />
    </div>
  );
}

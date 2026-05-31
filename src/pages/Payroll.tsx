import React, { useState, useMemo } from 'react';
import { useStore, PaymentMethod } from '../store';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Banknote, Download, CheckCircle, Search, Calendar, Eye, X, Printer } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export function Payroll() {
  const { professors, attendances, courses, payments, addPayment, updatePayment, deletePayment, settings } = useStore();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [searchTerm, setSearchTerm] = useState('');
  
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payslipModalOpen, setPayslipModalOpen] = useState(false);
  const [selectedProfData, setSelectedProfData] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    method: 'Espèces' as PaymentMethod,
    reference: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const handleExportPDF = async () => {
    const element = document.getElementById('payroll-table-export');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.setFontSize(16);
      pdf.text(`État de paie - ${format(parseISO(selectedMonth + '-01'), 'MMMM yyyy', { locale: fr })}`, 15, 15);
      
      const yOffset = 25;
      pdf.addImage(imgData, 'PNG', 10, yOffset, pdfWidth - 20, pdfHeight * ((pdfWidth - 20) / pdfWidth));
      pdf.save(`Paie_${selectedMonth}.pdf`);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Une erreur est survenue lors de la génération du PDF.');
    }
  };

  const payrollData = useMemo(() => {
    const start = startOfMonth(parseISO(`${selectedMonth}-01`));
    const end = endOfMonth(parseISO(`${selectedMonth}-01`));

    return professors.map(prof => {
      const profAttendances = attendances.filter(a => {
        const attDate = parseISO(a.date);
        const isProf = a.professorId === prof.id || a.replacementProfessorId === prof.id;
        const isReplaced = a.status === 'remplacement' && a.professorId === prof.id;
        return isProf && !isReplaced && isWithinInterval(attDate, { start, end });
      });

      const profCourses = courses.filter(c => {
        const cDate = parseISO(c.date);
        return c.professorId === prof.id && isWithinInterval(cDate, { start, end });
      });

      const plannedHours = profCourses.reduce((acc, c) => {
        const s = new Date(`2000-01-01T${c.startTime}`);
        const e = new Date(`2000-01-01T${c.endTime}`);
        return acc + (e.getTime() - s.getTime()) / (1000 * 60 * 60);
      }, 0);

      const missedHours = profCourses.filter(c => c.status === 'absent').reduce((acc, c) => {
        const s = new Date(`2000-01-01T${c.startTime}`);
        const e = new Date(`2000-01-01T${c.endTime}`);
        return acc + (e.getTime() - s.getTime()) / (1000 * 60 * 60);
      }, 0);

      const totalHours = profAttendances.reduce((acc, att) => acc + (att.calculatedHours || 0), 0);
      
      const overtimeHours = Math.max(0, totalHours - plannedHours);
      const normalHours = totalHours - overtimeHours;

      const hourlyRate = prof.hourlyRate || 0;
      const overtimeRate = hourlyRate * (settings?.overtimeCoefficient || 1.25);
      
      const amount = (normalHours * hourlyRate) + (overtimeHours * overtimeRate);
      
      const payment = payments.find(p => p.professorId === prof.id && p.month === selectedMonth);

      return {
        professor: prof,
        plannedHours,
        totalHours,
        normalHours,
        overtimeHours,
        missedHours,
        amount,
        payment
      };
    }).filter(data => {
      const searchLower = searchTerm.toLowerCase();
      const firstName = data.professor.firstName || '';
      const lastName = data.professor.lastName || '';
      return (
        firstName.toLowerCase().includes(searchLower) ||
        lastName.toLowerCase().includes(searchLower)
      );
    }).sort((a, b) => b.amount - a.amount);
  }, [professors, attendances, courses, payments, selectedMonth, searchTerm]);

  const handleOpenPayment = (data: any) => {
    setSelectedProfData(data);
    setPaymentForm({
      method: 'Espèces',
      reference: '',
      date: format(new Date(), 'yyyy-MM-dd')
    });
    setPaymentModalOpen(true);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProfData) {
      addPayment({
        professorId: selectedProfData.professor.id,
        month: selectedMonth,
        amount: selectedProfData.amount,
        hours: selectedProfData.totalHours,
        normalHours: selectedProfData.normalHours,
        overtimeHours: selectedProfData.overtimeHours,
        plannedHours: selectedProfData.plannedHours,
        missedHours: selectedProfData.missedHours,
        status: 'awaiting_approval',
        paidAt: new Date(paymentForm.date).toISOString(),
        paymentMethod: paymentForm.method as any,
        reference: paymentForm.reference
      });
      setPaymentModalOpen(false);
      setSelectedProfData(null);
    }
  };

  const totalAmount = payrollData.reduce((acc, data) => acc + data.amount, 0);
  const totalPaid = payrollData.reduce((acc, data) => acc + (data.payment?.status === 'paid' ? data.amount : 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Heures & Paie</h1>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              const unpaid = payrollData.filter(d => !d.payment || d.payment.status === 'pending');
              if (unpaid.length === 0) {
                return;
              }
              unpaid.forEach(data => {
                addPayment({
                  professorId: data.professor.id,
                  month: selectedMonth,
                  amount: data.amount,
                  hours: data.totalHours,
                  normalHours: data.normalHours,
                  overtimeHours: data.overtimeHours,
                  plannedHours: data.plannedHours,
                  missedHours: data.missedHours,
                  status: 'awaiting_approval',
                  paidAt: new Date().toISOString(),
                  paymentMethod: 'Virement', // Default
                  reference: 'Paiement groupé'
                });
              });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
          >
            <Banknote className="w-4 h-4" />
            Tout Payer
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
          >
            <Download className="w-4 h-4" />
            Exporter tout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-500 mb-1">Total à payer ce mois</p>
          <p className="text-3xl font-bold text-gray-900">{(totalAmount || 0).toLocaleString()} {settings?.currency || 'CFA'}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-500 mb-1">Total payé</p>
          <p className="text-3xl font-bold text-emerald-600">{(totalPaid || 0).toLocaleString()} {settings?.currency || 'CFA'}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-500 mb-1">Reste à payer</p>
          <p className="text-3xl font-bold text-amber-600">{(totalAmount - totalPaid || 0).toLocaleString()} {settings?.currency || 'CFA'}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-500 mb-1">Heures Globales</p>
          <p className="text-3xl font-bold text-indigo-600">
            {(payrollData.reduce((acc, data) => acc + (data.totalHours || 0), 0) || 0).toFixed(1)} h
          </p>
        </div>
      </div>

      <div id="payroll-table-export" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center gap-4 bg-gray-50">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-300">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border-none bg-transparent focus:ring-0 text-sm font-medium text-gray-900 p-0"
            />
          </div>
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher un professeur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Professeur</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">H. Prévues</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">H. Effectuées</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">H. Sup</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Taux Horaire</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Montant Total</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-center">Statut</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payrollData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Aucune donnée pour ce mois.
                  </td>
                </tr>
              ) : (
                payrollData.map((data) => (
                  <tr key={data.professor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{data.professor.firstName} {data.professor.lastName}</div>
                      <div className="text-sm text-gray-500">{data.professor.specialty}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-right">
                      {data.plannedHours.toFixed(1)} h
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                      {data.totalHours.toFixed(1)} h
                    </td>
                    <td className="px-6 py-4 text-sm text-amber-600 text-right font-medium">
                      {data.overtimeHours > 0 ? `+${data.overtimeHours.toFixed(1)} h` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-right">
                      {data.professor.hourlyRate?.toLocaleString() || 0} {settings?.currency || 'CFA'}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                      {data.amount.toLocaleString()} {settings?.currency || 'CFA'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {data.payment?.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Payé
                        </span>
                      ) : data.payment?.status === 'awaiting_approval' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          <Banknote className="w-3.5 h-3.5" />
                          En attente d'approbation du professeur
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                          <Banknote className="w-3.5 h-3.5" />
                          En attente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!data.payment || data.payment.status === 'pending' ? (
                          <button
                            onClick={() => handleOpenPayment(data)}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                          >
                            Payer
                          </button>
                        ) : (
                          <>
                            <button
                              disabled
                              className="px-3 py-1.5 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
                            >
                              Annuler
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedProfData(data);
                            setPayslipModalOpen(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Télécharger la fiche de paie"
                        >
                          <Download className="w-5 h-5" />
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

      {paymentModalOpen && selectedProfData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Paiement - {selectedProfData.professor.firstName} {selectedProfData.professor.lastName}
              </h2>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Heures normales ({selectedProfData.normalHours.toFixed(1)}h)</span>
                  <span className="font-medium">{(selectedProfData.normalHours * (selectedProfData.professor.hourlyRate || 0)).toLocaleString()} {settings?.currency || 'CFA'}</span>
                </div>
                {selectedProfData.overtimeHours > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Heures sup. ({selectedProfData.overtimeHours.toFixed(1)}h à +{((settings?.overtimeCoefficient || 1.25) - 1) * 100}%)</span>
                    <span className="font-medium text-amber-600">{(selectedProfData.overtimeHours * (selectedProfData.professor.hourlyRate || 0) * (settings?.overtimeCoefficient || 1.25)).toLocaleString()} {settings?.currency || 'CFA'}</span>
                  </div>
                )}
                <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between font-bold text-lg">
                  <span>Total à payer</span>
                  <span className="text-indigo-600">{selectedProfData.amount.toLocaleString()} {settings?.currency || 'CFA'}</span>
                </div>
              </div>

              <form id="payment-form" onSubmit={handleConfirmPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value as PaymentMethod })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Espèces">Espèces</option>
                    <option value="Mobile Money">Mobile Money (Orange/MTN/Wave)</option>
                    <option value="Virement">Virement bancaire</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date du paiement</label>
                  <input
                    type="date"
                    required
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Référence (Optionnel)</label>
                  <input
                    type="text"
                    placeholder="N° de transaction, chèque..."
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div className="pt-6 border-t border-gray-200 mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Confirmer le paiement
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {payslipModalOpen && selectedProfData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Fiche de paie - {selectedProfData.professor.firstName} {selectedProfData.professor.lastName}
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
                      <p className="text-gray-500 mt-1">Mois: {format(new Date(selectedMonth + '-01'), 'MMMM yyyy', { locale: fr })}</p>
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
                        <p><span className="text-gray-500">Nom:</span> <span className="font-medium">{selectedProfData.professor.lastName}</span></p>
                        <p><span className="text-gray-500">Prénoms:</span> <span className="font-medium">{selectedProfData.professor.firstName}</span></p>
                        <p><span className="text-gray-500">Spécialité:</span> <span className="font-medium">{selectedProfData.professor.specialty}</span></p>
                        <p><span className="text-gray-500">Taux horaire:</span> <span className="font-medium">{selectedProfData.professor.hourlyRate?.toLocaleString()} {settings?.currency || 'CFA'}</span></p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Détails du paiement</h4>
                      <div className="space-y-1">
                        <p><span className="text-gray-500">Statut:</span> <span className="font-medium">{selectedProfData.payment?.status === 'paid' ? 'Payé' : selectedProfData.payment?.status === 'awaiting_approval' ? 'En attente d\'approbation' : 'En attente'}</span></p>
                        {selectedProfData.payment?.paidAt && (
                          <p><span className="text-gray-500">Date:</span> <span className="font-medium">{format(new Date(selectedProfData.payment.paidAt), 'dd/MM/yyyy')}</span></p>
                        )}
                        {selectedProfData.payment?.paymentMethod && (
                          <p><span className="text-gray-500">Méthode:</span> <span className="font-medium">{selectedProfData.payment.paymentMethod}</span></p>
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
                        <td className="py-3 text-sm text-gray-900 text-right">{selectedProfData.normalHours.toFixed(1)}</td>
                        <td className="py-3 text-sm text-gray-900 text-right">{selectedProfData.professor.hourlyRate?.toLocaleString()}</td>
                        <td className="py-3 text-sm text-gray-900 text-right">{(selectedProfData.normalHours * (selectedProfData.professor.hourlyRate || 0)).toLocaleString()}</td>
                      </tr>
                      {selectedProfData.overtimeHours > 0 && (
                        <tr>
                          <td className="py-3 text-sm text-gray-900">Heures supplémentaires</td>
                          <td className="py-3 text-sm text-gray-900 text-right">{selectedProfData.overtimeHours.toFixed(1)}</td>
                          <td className="py-3 text-sm text-gray-900 text-right">{((selectedProfData.professor.hourlyRate || 0) * (settings?.overtimeCoefficient || 1.25)).toLocaleString()}</td>
                          <td className="py-3 text-sm text-gray-900 text-right">{(selectedProfData.overtimeHours * (selectedProfData.professor.hourlyRate || 0) * (settings?.overtimeCoefficient || 1.25)).toLocaleString()}</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-300">
                        <td colSpan={3} className="py-4 text-right font-bold text-gray-900">NET À PAYER</td>
                        <td className="py-4 text-right font-bold text-xl text-indigo-600">{selectedProfData.amount.toLocaleString()} {settings?.currency || 'CFA'}</td>
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
    </div>
  );
}

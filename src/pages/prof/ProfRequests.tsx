import React, { useState } from 'react';
import { useStore } from '../../store';
import { FileText, Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export function ProfRequests() {
  const { currentUser, professors, professorRequests, addProfessorRequest } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestType, setRequestType] = useState<'absence' | 'retard'>('absence');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');

  const professor = professors.find(p => p.userId === currentUser?.id);

  if (!professor) {
    return <div className="p-8">Professeur non trouvé.</div>;
  }

  const myRequests = professorRequests
    .filter(req => req.professorId === professor.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !reason) return;

    addProfessorRequest({
      professorId: professor.id,
      type: requestType,
      date,
      reason,
      status: 'en attente',
    });

    setIsModalOpen(false);
    setDate('');
    setReason('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approuvé': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejeté': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approuvé': return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Approuvé</span>;
      case 'rejeté': return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Rejeté</span>;
      default: return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">En attente</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demandes & Signalements</h1>
          <p className="text-gray-500 mt-1">Gérez vos demandes d'absence et signalez vos retards</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Demande
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {myRequests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p>Aucune demande pour le moment.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {myRequests.map((req) => (
              <div key={req.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${req.type === 'absence' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 capitalize">
                        {req.type === 'absence' ? 'Demande d\'absence' : 'Signalement de retard'}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Pour la date du : {new Date(req.date).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-gray-700 mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        {req.reason}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(req.status)}
                    <span className="text-xs text-gray-400">
                      Soumis le {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Nouvelle Demande</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de demande</label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="absence">Demande d'absence</option>
                  <option value="retard">Signalement de retard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date concernée</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motif</label>
                <textarea
                  required
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Veuillez expliquer la raison de votre demande..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Soumettre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

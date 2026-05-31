import React, { useState } from 'react';
import { useStore } from '../store';
import { FileText, CheckCircle, XCircle, AlertCircle, Search, Filter } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export function Requests() {
  const { professorRequests, professors, updateProfessorRequest } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Tous' | 'en attente' | 'approuvé' | 'rejeté'>('Tous');
  const [typeFilter, setTypeFilter] = useState<'Tous' | 'absence' | 'retard'>('Tous');
  
  const [requestToApprove, setRequestToApprove] = useState<string | null>(null);
  const [requestToReject, setRequestToReject] = useState<string | null>(null);

  const handleApprove = () => {
    if (requestToApprove) {
      updateProfessorRequest(requestToApprove, { status: 'approuvé' });
      setRequestToApprove(null);
    }
  };

  const handleReject = () => {
    if (requestToReject) {
      updateProfessorRequest(requestToReject, { status: 'rejeté' });
      setRequestToReject(null);
    }
  };

  const filteredRequests = professorRequests
    .filter(req => {
      const professor = professors.find(p => p.id === req.professorId);
      const searchMatch = professor 
        ? `${professor.firstName} ${professor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
        : false;
      
      const statusMatch = statusFilter === 'Tous' || req.status === statusFilter;
      const typeMatch = typeFilter === 'Tous' || req.type === typeFilter;

      return searchMatch && statusMatch && typeMatch;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
          <p className="text-gray-500 mt-1">Gérez les demandes d'absence et les signalements de retard des professeurs</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un professeur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="Tous">Tous les statuts</option>
              <option value="en attente">En attente</option>
              <option value="approuvé">Approuvés</option>
              <option value="rejeté">Rejetés</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="Tous">Tous les types</option>
              <option value="absence">Absences</option>
              <option value="retard">Retards</option>
            </select>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p>Aucune demande trouvée.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRequests.map((req) => {
              const professor = professors.find(p => p.id === req.professorId);
              
              return (
                <div key={req.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${req.type === 'absence' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-medium text-gray-900">
                            {professor ? `${professor.firstName} ${professor.lastName}` : 'Professeur inconnu'}
                          </h3>
                          {getStatusBadge(req.status)}
                        </div>
                        <p className="text-sm font-medium text-indigo-600 mt-1 capitalize">
                          {req.type === 'absence' ? 'Demande d\'absence' : 'Signalement de retard'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Date concernée : {new Date(req.date).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-gray-700 mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                          {req.reason}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Soumis le {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    
                    {req.status === 'en attente' && (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => setRequestToApprove(req.id)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approuver
                        </button>
                        <button
                          onClick={() => setRequestToReject(req.id)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Rejeter
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!requestToApprove}
        onClose={() => setRequestToApprove(null)}
        onConfirm={handleApprove}
        title="Approuver la demande"
        message="Êtes-vous sûr de vouloir approuver cette demande ?"
        confirmText="Approuver"
        cancelText="Annuler"
      />

      <ConfirmModal
        isOpen={!!requestToReject}
        onClose={() => setRequestToReject(null)}
        onConfirm={handleReject}
        title="Rejeter la demande"
        message="Êtes-vous sûr de vouloir rejeter cette demande ?"
        confirmText="Rejeter"
        cancelText="Annuler"
        isDanger={true}
      />
    </div>
  );
}

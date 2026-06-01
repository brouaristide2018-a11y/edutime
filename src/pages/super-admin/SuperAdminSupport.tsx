import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { Send, MessageSquare, Clock, CheckCircle, Search } from 'lucide-react';
import { ConfirmModal } from '../../components/ConfirmModal';

export function SuperAdminSupport() {
  const currentUser = useStore(state => state.currentUser);
  const supportTickets = useStore(state => state.supportTickets);
  const updateSupportTicket = useStore(state => state.updateSupportTicket);

  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Tous' | 'Ouvert' | 'Fermé'>('Tous');
  const [ticketToClose, setTicketToClose] = useState<any | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter tickets: last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const tickets = [...supportTickets]
    .filter(ticket => new Date(ticket.updatedAt) > sevenDaysAgo)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Keep active ticket in sync with store
  useEffect(() => {
    if (activeTicket) {
      const updated = tickets.find(t => t.id === activeTicket.id);
      if (updated) setActiveTicket(updated);
    }
  }, [supportTickets]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTicket?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeTicket || !currentUser) return;

    const message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: newMessage,
      timestamp: new Date().toISOString()
    };

    updateSupportTicket(activeTicket.id, {
      messages: [...(activeTicket.messages || []), message],
      updatedAt: new Date().toISOString(),
      status: 'Ouvert'
    });

    setNewMessage('');
  };

  const handleCloseTicket = () => {
    if (!ticketToClose) return;
    updateSupportTicket(ticketToClose.id, {
      status: 'Fermé',
      updatedAt: new Date().toISOString()
    });
    setTicketToClose(null);
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ticket.senderName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Tous' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 h-screen flex flex-col">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Support Technique</h1>

      <div className="flex-1 flex bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Sidebar - Ticket List */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
          <div className="p-4 border-b border-gray-200 bg-white space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              {(['Tous', 'Ouvert', 'Fermé'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    statusFilter === status
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Aucune requête trouvée.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredTickets.map(ticket => (
                  <button
                    key={ticket.id}
                    onClick={() => setActiveTicket(ticket)}
                    className={`w-full text-left p-4 hover:bg-gray-100 transition-colors ${activeTicket?.id === ticket.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-medium text-gray-900 truncate pr-2">{ticket.subject}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${ticket.status === 'Ouvert' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{ticket.senderName} ({ticket.senderRole})</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(ticket.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {activeTicket ? (
            <>
              <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{activeTicket.subject}</h2>
                  <p className="text-sm text-gray-500">
                    De: {activeTicket.senderName} ({activeTicket.senderId})
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${activeTicket.status === 'Ouvert' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {activeTicket.status}
                  </span>
                  {activeTicket.status === 'Ouvert' && (
                    <button
                      onClick={() => setTicketToClose(activeTicket)}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                    >
                      Fermer la requête
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {activeTicket.messages?.length === 0 ? (
                  <div className="text-center text-gray-500 mt-10">
                    Aucun message dans cette requête.
                  </div>
                ) : (
                  activeTicket.messages?.map((msg: any) => {
                    const isMe = msg.senderId === currentUser?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-900 rounded-tl-none'}`}>
                          {!isMe && <p className="text-xs font-medium text-indigo-600 mb-1">{msg.senderName}</p>}
                          <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                          <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-white border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Écrivez votre réponse..."
                    className="flex-1 rounded-full border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-4 border"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 flex-col">
              <MessageSquare className="w-16 h-16 mb-4 text-gray-300" />
              <p>Sélectionnez une requête pour voir la conversation.</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!ticketToClose}
        onClose={() => setTicketToClose(null)}
        onConfirm={handleCloseTicket}
        title="Fermer la requête"
        message="Êtes-vous sûr de vouloir fermer cette requête de support ?"
        confirmText="Fermer"
        cancelText="Annuler"
      />
    </div>
  );
}

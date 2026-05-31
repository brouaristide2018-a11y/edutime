import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useStore } from '../store';
import { Send, Plus, MessageSquare, Clock, CheckCircle } from 'lucide-react';

export function Support() {
  const currentUser = useStore(state => state.currentUser);
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) return;

    // Filter out tickets older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const q = query(
      collection(db, 'support_tickets'),
      where('senderId', '==', currentUser.id),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTickets = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(ticket => new Date(ticket.updatedAt) > sevenDaysAgo);
      
      setTickets(fetchedTickets);
      
      if (activeTicket) {
        const updatedActive = fetchedTickets.find(t => t.id === activeTicket.id);
        if (updatedActive) setActiveTicket(updatedActive);
      }
    }, (error) => {
      console.error("Error fetching support tickets:", error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTicket?.messages]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !currentUser) return;

    try {
      const newTicket = {
        subject: newTicketSubject,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        status: 'Ouvert',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      };

      const docRef = await addDoc(collection(db, 'support_tickets'), newTicket);
      setNewTicketSubject('');
      setIsCreating(false);
      setActiveTicket({ id: docRef.id, ...newTicket });
    } catch (error) {
      console.error("Error creating ticket:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeTicket || !currentUser) return;

    try {
      const message = {
        id: Date.now().toString(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        text: newMessage,
        timestamp: new Date().toISOString()
      };

      const ticketRef = doc(db, 'support_tickets', activeTicket.id);
      await updateDoc(ticketRef, {
        messages: [...(activeTicket.messages || []), message],
        updatedAt: new Date().toISOString()
      });

      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Sidebar - Ticket List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
        <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Mes Requêtes</h2>
          <button 
            onClick={() => setIsCreating(true)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Nouvelle requête"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {tickets.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Aucune requête en cours.</p>
              <p className="text-xs mt-2">Les requêtes sont conservées pendant 7 jours maximum.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tickets.map(ticket => (
                <button
                  key={ticket.id}
                  onClick={() => { setActiveTicket(ticket); setIsCreating(false); }}
                  className={`w-full text-left p-4 hover:bg-gray-100 transition-colors ${activeTicket?.id === ticket.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-gray-900 truncate pr-2">{ticket.subject}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${ticket.status === 'Ouvert' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
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
        {isCreating ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-md w-full bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Nouvelle Requête</h2>
              <form onSubmit={handleCreateTicket}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sujet de la requête</label>
                  <input
                    type="text"
                    required
                    value={newTicketSubject}
                    onChange={(e) => setNewTicketSubject(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 border"
                    placeholder="Ex: Problème de connexion, Question sur la paie..."
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    Créer
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : activeTicket ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{activeTicket.subject}</h2>
                <p className="text-sm text-gray-500">
                  Créé le {new Date(activeTicket.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${activeTicket.status === 'Ouvert' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {activeTicket.status}
              </span>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {activeTicket.messages?.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">
                  Envoyez votre premier message pour démarrer la conversation.
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

            {/* Message Input */}
            {activeTicket.status === 'Ouvert' ? (
              <div className="p-4 bg-white border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Écrivez votre message..."
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
            ) : (
              <div className="p-4 bg-gray-50 border-t border-gray-200 text-center text-gray-500 flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Cette requête a été fermée.
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 flex-col">
            <MessageSquare className="w-16 h-16 mb-4 text-gray-300" />
            <p>Sélectionnez une requête ou créez-en une nouvelle.</p>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useStore } from '../../store';
import { Megaphone, Plus, Edit2, Trash2, Globe, X, Save } from 'lucide-react';
import { ConfirmModal } from '../../components/ConfirmModal';
import type { Announcement } from '../../store';

export function SuperAdminAds() {
  const announcements = useStore(state => state.announcements);
  const addAnnouncement = useStore(state => state.addAnnouncement);
  const updateAnnouncement = useStore(state => state.updateAnnouncement);
  const deleteAnnouncement = useStore(state => state.deleteAnnouncement);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<Announcement, 'id' | 'createdAt'>>({
    title: '',
    content: '',
    type: 'announcement',
    isPublic: false,
    status: 'active'
  });

  const sortedAnnouncements = [...announcements].sort((a, b) => b.createdAt - a.createdAt);

  const handleOpenModal = (item?: Announcement) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        content: item.content,
        type: item.type,
        isPublic: item.isPublic,
        status: item.status
      });
    } else {
      setEditingItem(null);
      setFormData({
        title: '',
        content: '',
        type: 'announcement',
        isPublic: false,
        status: 'active'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateAnnouncement(editingItem.id, {
        ...formData,
        createdAt: editingItem.createdAt
      });
    } else {
      addAnnouncement({
        ...formData,
        createdAt: Date.now()
      });
    }
    handleCloseModal();
  };

  const handleDelete = () => {
    if (!itemToDelete) return;
    deleteAnnouncement(itemToDelete);
    setItemToDelete(null);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Megaphone className="w-8 h-8 text-indigo-600" />
          Annonces & Pubs
        </h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          Nouvelle Publication
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedAnnouncements.map((item) => (
          <div key={item.id} className={`bg-white rounded-xl shadow-sm border ${item.status === 'active' ? 'border-indigo-200' : 'border-gray-200'} overflow-hidden flex flex-col`}>
            <div className={`p-6 border-b ${item.type === 'ad' ? 'bg-amber-50 border-amber-100' : 'bg-indigo-50 border-indigo-100'}`}>
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${item.type === 'ad' ? 'bg-amber-200 text-amber-800' : 'bg-indigo-200 text-indigo-800'}`}>
                  {item.type === 'ad' ? 'Publicité' : 'Annonce'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {item.status === 'active' ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{item.title}</h3>
              {item.isPublic && (
                <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600">
                  <Globe className="w-4 h-4" /> Publié sur la page publique
                </div>
              )}
            </div>

            <div className="p-6 flex-1">
              <p className="text-gray-600 text-sm whitespace-pre-wrap">{item.content}</p>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                onClick={() => handleOpenModal(item)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <Edit2 size={18} />
                Modifier
              </button>
              <button
                onClick={() => setItemToDelete(item.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                title="Supprimer"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}

        {sortedAnnouncements.length === 0 && (
          <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500 mb-4">Aucune annonce ou publicité n'a été créée.</p>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={20} />
              Créer la première publication
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingItem ? 'Modifier la publication' : 'Créer une publication'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="announcement-form" onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Titre de l'annonce ou publicité"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'announcement' | 'ad' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="announcement">Annonce Générale</option>
                      <option value="ad">Publicité</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Publier sur la page publique</p>
                      <p className="text-sm text-gray-500">Si coché, ceci sera visible par les visiteurs non connectés sur la landing page.</p>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contenu / Message</label>
                  <textarea
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Écrivez votre message ici..."
                  ></textarea>
                </div>

                <div className="pt-6 border-t border-gray-200 mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <Save size={20} />
                    {editingItem ? 'Mettre à jour' : 'Publier'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDelete}
        title="Supprimer"
        message="Êtes-vous sûr de vouloir supprimer cette publication ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
      />
    </div>
  );
}

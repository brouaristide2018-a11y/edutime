import React, { useState } from 'react';
import { useStore, User, Role } from '../store';
import { Users, Edit2, Trash2, Shield, Check, X } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export function UsersSettings() {
  const { users, addUser, updateUser, deleteUser } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'Gestionnaire',
    status: 'Actif',
    permissions: {
      planning: { view: true, add: false, edit: false, delete: false },
      payroll: { view: false, add: false, edit: false, delete: false },
      users: { view: false, add: false, edit: false, delete: false },
      settings: { view: false, add: false, edit: false, delete: false },
    }
  });

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingId(user.id);
      setFormData(user);
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        email: '',
        role: 'Gestionnaire',
        status: 'Actif',
        permissions: {
          planning: { view: true, add: false, edit: false, delete: false },
          payroll: { view: false, add: false, edit: false, delete: false },
          users: { view: false, add: false, edit: false, delete: false },
          settings: { view: false, add: false, edit: false, delete: false },
        }
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const oldUser = users.find(u => u.id === editingId);
      if (oldUser && oldUser.email !== formData.email) {
        // Email changed, create new user and delete old one
        addUser({ ...oldUser, ...formData } as Omit<User, 'id'>);
        deleteUser(editingId);
      } else {
        updateUser(editingId, formData);
      }
    } else {
      addUser(formData as Omit<User, 'id'>);
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (userToDelete) {
      deleteUser(userToDelete);
      setUserToDelete(null);
    }
  };

  const handlePermissionChange = (module: keyof User['permissions'], action: keyof User['permissions']['planning'], value: boolean) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [module]: {
          ...formData.permissions![module],
          [action]: value
        }
      }
    } as Partial<User>);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Utilisateurs & rôles</h2>
        <button 
          onClick={() => handleOpenModal()}
          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100"
        >
          + Nouvel utilisateur
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Utilisateur</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Rôle</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Dernière connexion</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Shield size={14} className={user.role === 'Admin' ? 'text-indigo-600' : 'text-gray-400'} />
                      <span className="text-sm text-gray-900">{user.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.status === 'Actif' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    }) : 'Jamais'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenModal(user)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => setUserToDelete(user.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        disabled={user.role === 'Admin' && users.filter(u => u.role === 'Admin').length === 1}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingId ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email || ''}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
                  <select
                    required
                    value={formData.role || 'Gestionnaire'}
                    onChange={e => setFormData({...formData, role: e.target.value as Role})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Gestionnaire">Gestionnaire</option>
                    <option value="Professeur">Professeur</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut *</label>
                  <select
                    required
                    value={formData.status || 'Actif'}
                    onChange={e => setFormData({...formData, status: e.target.value as 'Actif' | 'Inactif'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Actif">Actif</option>
                    <option value="Inactif">Inactif</option>
                  </select>
                </div>
              </div>

              {formData.role !== 'Admin' && (
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4 border-b border-gray-200 pb-2">Permissions</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Module</th>
                          <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase text-center">Voir</th>
                          <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase text-center">Ajouter</th>
                          <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase text-center">Modifier</th>
                          <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase text-center">Supprimer</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(['planning', 'payroll', 'users', 'settings'] as const).map((module) => (
                          <tr key={module} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">
                              {module === 'planning' ? 'Planning & Présences' : 
                               module === 'payroll' ? 'Paie' : 
                               module === 'users' ? 'Utilisateurs' : 'Paramètres'}
                            </td>
                            {(['view', 'add', 'edit', 'delete'] as const).map((action) => (
                              <td key={action} className="px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={formData.permissions?.[module]?.[action] || false}
                                  onChange={(e) => handlePermissionChange(module, action, e.target.checked)}
                                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  {editingId ? 'Mettre à jour' : 'Créer l\'utilisateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDelete}
        title="Supprimer l'utilisateur"
        message="Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
      />
    </div>
  );
}

import React, { useState } from 'react';
import { useStore } from '../store';
import { CalendarDays, ArrowLeft, Edit2 } from 'lucide-react';
import { WeeklySchedule } from '../components/WeeklySchedule';

export function ClassTimetable() {
  const classes = useStore(state => state.classes);
  const professors = useStore(state => state.professors);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedClassId) {
    const cls = classes.find(c => c.id === selectedClassId);
    return (
      <div className="space-y-4 h-full flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setSelectedClassId(null);
                setIsEditing(false);
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-xl font-bold text-gray-900">
              Emploi du temps : {cls?.name}
            </h2>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isEditing 
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            <Edit2 className="w-4 h-4" />
            {isEditing ? 'Mode édition actif' : 'Modifier'}
          </button>
        </div>
        <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <WeeklySchedule type="class" id={selectedClassId} readOnly={!isEditing} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pt-4">
        <h1 className="text-2xl font-bold text-gray-900">Emploi du temps Classe</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Recherche:</label>
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm w-64"
            placeholder="Nom ou niveau..."
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-500 text-white">
                <th className="px-4 py-3 text-sm font-bold uppercase w-16">N°</th>
                <th className="px-4 py-3 text-sm font-bold uppercase">CLASSE</th>
                <th className="px-4 py-3 text-sm font-bold uppercase">NIVEAU</th>
                <th className="px-4 py-3 text-sm font-bold uppercase">EFFECTIF</th>
                <th className="px-4 py-3 text-sm font-bold uppercase">PROF. PRINCIPAL</th>
                <th className="px-4 py-3 text-sm font-bold uppercase">CHEF DE CLASSE</th>
                <th className="px-4 py-3 text-sm font-bold uppercase">SOUS CHEF</th>
                <th className="px-4 py-3 text-sm font-bold uppercase text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredClasses.map((cls, index) => {
                const mainTeacher = professors.find(p => p.id === cls.mainTeacherId);
                return (
                  <tr key={cls.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                    <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{cls.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{cls.level}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{cls.capacity}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {mainTeacher ? `${mainTeacher.firstName} ${mainTeacher.lastName}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{cls.chefDeClasse || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{cls.sousChefDeClasse || '-'}</td>
                    <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => setSelectedClassId(cls.id)}
                        className="flex items-center gap-1 px-2 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-xs font-medium shadow-sm"
                        title="Voir emploi du temps"
                      >
                        <CalendarDays className="w-3.5 h-3.5" />
                        Voir emploi du temps
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
              {filteredClasses.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Aucune classe trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

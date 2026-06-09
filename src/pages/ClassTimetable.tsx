import React, { useState } from 'react';
import { useStore } from '../store';
import { CalendarDays, ArrowLeft, Edit2, Search, Users, BookOpen } from 'lucide-react';
import { WeeklySchedule } from '../components/WeeklySchedule';

const LEVEL_COLORS: Record<string, string> = {
  '6ème': 'bg-blue-100 text-blue-700',
  '5ème': 'bg-indigo-100 text-indigo-700',
  '4ème': 'bg-purple-100 text-purple-700',
  '3ème': 'bg-violet-100 text-violet-700',
  '2nde': 'bg-amber-100 text-amber-700',
  '1ère': 'bg-orange-100 text-orange-700',
  'Tle':  'bg-rose-100 text-rose-700',
  'Terminale': 'bg-rose-100 text-rose-700',
};

function getLevelColor(level: string): string {
  for (const key in LEVEL_COLORS) {
    if (level?.toLowerCase().includes(key.toLowerCase())) return LEVEL_COLORS[key];
  }
  return 'bg-gray-100 text-gray-700';
}

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

  /* ── Vue emploi du temps d'une classe ── */
  if (selectedClassId) {
    const cls = classes.find(c => c.id === selectedClassId);
    return (
      <div className="space-y-4 h-full flex flex-col">
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedClassId(null); setIsEditing(false); }}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{cls?.name}</h2>
              <p className="text-sm text-gray-500">Emploi du temps</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors text-sm font-semibold ${
              isEditing
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            <Edit2 className="w-4 h-4" />
            {isEditing ? 'Édition active' : 'Modifier'}
          </button>
        </div>
        <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <WeeklySchedule type="class" id={selectedClassId} readOnly={!isEditing} />
        </div>
      </div>
    );
  }

  /* ── Liste des classes ── */
  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emploi du temps Classe</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filteredClasses.length} classe(s)</p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher une classe ou un niveau..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        />
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider w-12">N°</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Classe</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Niveau</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Effectif</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Prof. Principal</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Chef de classe</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Sous-Chef</th>
                <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredClasses.map((cls, index) => {
                const mainTeacher = professors.find(p => p.id === cls.mainTeacherId);
                const levelColor = getLevelColor(cls.level);
                return (
                  <tr
                    key={cls.id}
                    className="hover:bg-indigo-50/40 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-sm text-gray-500 font-medium">{index + 1}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{cls.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${levelColor}`}>
                        {cls.level}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        {cls.capacity || '—'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {mainTeacher ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0">
                            {mainTeacher.firstName?.[0]}{mainTeacher.lastName?.[0]}
                          </div>
                          <span className="text-sm text-gray-700">
                            {mainTeacher.firstName} {mainTeacher.lastName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{cls.chefDeClasse || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{cls.sousChefDeClasse || '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setSelectedClassId(cls.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs font-semibold shadow-sm"
                        >
                          <CalendarDays className="w-3.5 h-3.5" />
                          Emploi du temps
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredClasses.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">Aucune classe trouvée.</p>
                    </div>
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

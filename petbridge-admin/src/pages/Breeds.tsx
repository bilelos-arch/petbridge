import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { breedService } from '../services/breedService';
import type { Breed } from '../services/breedService';

const SPECIES_OPTIONS = [
  { value: 'CHIEN', label: '🐶 Chien' },
  { value: 'CHAT', label: '🐱 Chat' },
  { value: 'AUTRE', label: '🐾 Autre' },
];

export default function BreedsPage() {
  const queryClient = useQueryClient();
  const [filterSpecies, setFilterSpecies] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBreed, setEditingBreed] = useState<Breed | null>(null);
  const [form, setForm] = useState({
    name: '',
    species: 'CHIEN' as 'CHIEN' | 'CHAT' | 'AUTRE',
    description: '',
  });

  const { data: breeds = [], isLoading } = useQuery({
    queryKey: ['breeds', filterSpecies],
    queryFn: () => breedService.getAll(filterSpecies || undefined),
  });

  const createMutation = useMutation({
    mutationFn: breedService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breeds'] });
      setShowForm(false);
      setForm({ name: '', species: 'CHIEN', description: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      breedService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breeds'] });
      setEditingBreed(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: breedService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breeds'] });
    },
  });

  const handleSubmit = () => {
    if (!form.name || !form.species) return;
    createMutation.mutate(form);
  };

  const handleUpdate = (breed: Breed) => {
    updateMutation.mutate({
      id: breed.id,
      data: { name: breed.name, description: breed.description },
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer cette race ?')) {
      deleteMutation.mutate(id);
    }
  };

  const speciesBadge = (species: string) => {
    const colors: Record<string, string> = {
      CHIEN: 'bg-orange-100 text-orange-700',
      CHAT: 'bg-teal-100 text-teal-700',
      AUTRE: 'bg-gray-100 text-gray-700',
    };
    const labels: Record<string, string> = {
      CHIEN: '🐶 Chien',
      CHAT: '🐱 Chat',
      AUTRE: '🐾 Autre',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[species]}`}>
        {labels[species]}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">🐾 Gestion des races</h1>
          <p className="text-slate-500 text-sm mt-1">
            {breeds.length} race{breeds.length > 1 ? 's' : ''} enregistrée{breeds.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          {showForm ? '✕ Annuler' : '+ Ajouter une race'}
        </button>
      </div>

      {/* Formulaire ajout */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">Nouvelle race</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">Nom</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Labrador"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">Espèce</label>
              <select
                value={form.species}
                onChange={(e) => setForm({ ...form, species: e.target.value as any })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SPECIES_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description courte..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {createMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilterSpecies('')}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition ${
            filterSpecies === ''
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
          }`}
        >
          Tous ({breeds.length})
        </button>
        {SPECIES_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilterSpecies(opt.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition ${
              filterSpecies === opt.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Chargement...</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-slate-600 font-semibold">Nom</th>
                <th className="text-left px-4 py-3 text-slate-600 font-semibold">Espèce</th>
                <th className="text-left px-4 py-3 text-slate-600 font-semibold">Description</th>
                <th className="text-right px-4 py-3 text-slate-600 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {breeds.map((breed: Breed, i: number) => (
                <tr
                  key={breed.id}
                  className={`border-b border-slate-100 hover:bg-slate-50 transition ${
                    i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {editingBreed?.id === breed.id ? (
                      <input
                        value={editingBreed.name}
                        onChange={(e) => setEditingBreed(prev => prev ? { ...prev, name: e.target.value } : null)}
                        className="border border-slate-200 rounded px-2 py-1 text-sm w-full"
                      />
                    ) : breed.name}
                  </td>
                  <td className="px-4 py-3">{speciesBadge(breed.species)}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {editingBreed?.id === breed.id ? (
                      <input
                        value={editingBreed.description || ''}
                        onChange={(e) => setEditingBreed(prev => prev ? { ...prev, description: e.target.value } : null)}
                        className="border border-slate-200 rounded px-2 py-1 text-sm w-full"
                      />
                    ) : (breed.description || '—')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingBreed?.id === breed.id ? (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleUpdate(editingBreed as Breed)}
                          className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700"
                        >
                          ✓ Sauvegarder
                        </button>
                        <button
                          onClick={() => setEditingBreed(null)}
                          className="text-xs bg-slate-200 text-slate-600 px-3 py-1 rounded-lg hover:bg-slate-300"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingBreed(breed)}
                          className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100"
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(breed.id)}
                          className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100"
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {breeds.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              Aucune race trouvée
            </div>
          )}
        </div>
      )}
    </div>
  );
}
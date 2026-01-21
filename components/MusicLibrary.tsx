
import React, { useState, useRef, useMemo } from 'react';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import type { MusicTrackMetadata, Dance } from '../types';
import * as musicDb from '../services/musicDb';

// Reusing Modal locally since it's not exported from DanceLibrary (best practice would be to move it to a separate file, but keeping minimal changes)
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
};

interface MusicLibraryProps {
  tracks: MusicTrackMetadata[];
  dances: Dance[];
  onAddTrack: (file: File, danceId: string) => void;
  onDeleteTrack: (id: string) => void;
}

type MusicSortKey = 'name' | 'dance';

const MusicLibrary: React.FC<MusicLibraryProps> = ({ tracks, dances, onAddTrack, onDeleteTrack }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentBlobUrl, setCurrentBlobUrl] = useState<string | null>(null);

  // Filter & Sort State
  const [filterDanceId, setFilterDanceId] = useState<string>('all');
  const [sortKey, setSortKey] = useState<MusicSortKey>('name');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDanceId, setUploadDanceId] = useState<string>(dances[0]?.id || '');

  const filteredAndSortedTracks = useMemo(() => {
    let result = [...tracks];

    // Filter
    if (filterDanceId !== 'all') {
      result = result.filter(t => t.danceId === filterDanceId);
    }

    // Sort
    result.sort((a, b) => {
      if (sortKey === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortKey === 'dance') {
        const danceA = dances.find(d => d.id === a.danceId)?.name || '';
        const danceB = dances.find(d => d.id === b.danceId)?.name || '';
        return danceA.localeCompare(danceB);
      }
      return 0;
    });

    return result;
  }, [tracks, filterDanceId, sortKey, dances]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setIsAddModalOpen(true);
      e.target.value = ''; // Reset input
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFile && uploadDanceId) {
        onAddTrack(uploadFile, uploadDanceId);
        setUploadFile(null);
        setIsAddModalOpen(false);
    }
  };

  const handlePlay = async (track: MusicTrackMetadata) => {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    const fullTrack = await musicDb.getTrack(track.id);
    if (fullTrack) {
      if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
      const url = URL.createObjectURL(fullTrack.blob);
      setCurrentBlobUrl(url);
      setPlayingId(track.id);
      
      setTimeout(() => {
          audioRef.current?.play();
      }, 50);
    }
  };

  const getDanceName = (id?: string) => {
    return dances.find(d => d.id === id)?.name || 'Без категории';
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold tracking-tight text-center text-cyan-400">Медиатека</h2>
      
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Filter & Sort Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-800/50 p-4 rounded-2xl border border-gray-700">
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <button 
                    onClick={() => setFilterDanceId('all')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filterDanceId === 'all' ? 'bg-cyan-600 text-white shadow-lg' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                >
                    Все
                </button>
                {dances.map(dance => (
                    <button 
                        key={dance.id}
                        onClick={() => setFilterDanceId(dance.id)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filterDanceId === dance.id ? 'bg-cyan-600 text-white shadow-lg' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                    >
                        {dance.name}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
                <span className="text-sm text-gray-500 hidden sm:inline">Сортировка:</span>
                <select 
                    value={sortKey} 
                    onChange={e => setSortKey(e.target.value as MusicSortKey)}
                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full md:w-auto p-2"
                >
                    <option value="name">По названию</option>
                    <option value="dance">По направлению</option>
                </select>
            </div>
        </div>

        {/* Tracks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Add Music Card */}
          <label className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-gray-600 hover:border-cyan-500 hover:bg-gray-800/50 transition-all cursor-pointer group h-full min-h-[180px]">
            <PlusIcon className="w-12 h-12 text-gray-500 group-hover:text-cyan-500 mb-2 transition-colors" />
            <span className="text-gray-400 group-hover:text-cyan-500 font-medium">Добавить трек</span>
            <input type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
          </label>

          {/* Track List */}
          {filteredAndSortedTracks.map((track) => (
            <div key={track.id} className="bg-gray-800 p-5 rounded-2xl shadow-lg border border-gray-700 flex flex-col justify-between hover:border-cyan-500/50 transition-colors group relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-grow pr-4">
                  <p className="font-semibold text-white truncate text-lg" title={track.name}>{track.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-cyan-900/40 text-cyan-400 text-[10px] font-bold rounded uppercase tracking-wider border border-cyan-800/50">
                        {getDanceName(track.danceId)}
                      </span>
                  </div>
                </div>
                <button 
                  onClick={() => onDeleteTrack(track.id)}
                  className="p-2 bg-gray-700 hover:bg-red-600 rounded-lg text-gray-400 hover:text-white transition-all shadow-md z-10"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
              
              <button 
                onClick={() => handlePlay(track)}
                className={`w-full py-2 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-inner ${
                  playingId === track.id ? 'bg-cyan-600 text-white animate-pulse' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {playingId === track.id ? (
                  <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> Пауза</>
                ) : (
                  <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Слушать</>
                )}
              </button>
            </div>
          ))}
        </div>

        {filteredAndSortedTracks.length === 0 && tracks.length > 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 italic">Нет треков, соответствующих выбранному фильтру.</p>
          </div>
        )}

        {tracks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 italic text-lg">Ваша медиатека пока пуста. Добавьте музыку для тренировок.</p>
          </div>
        )}
      </div>

      <audio 
        ref={audioRef} 
        src={currentBlobUrl || ''} 
        onEnded={() => setPlayingId(null)} 
        className="hidden" 
      />

      {/* Upload Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Параметры загрузки">
        <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
                <p className="text-sm text-gray-400 mb-1">Выбранный файл:</p>
                <p className="text-white font-medium truncate bg-gray-700 p-2 rounded-lg border border-gray-600">{uploadFile?.name}</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Направление танца</label>
                <select 
                    value={uploadDanceId} 
                    onChange={e => setUploadDanceId(e.target.value)}
                    required
                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5"
                >
                    {dances.map(dance => (
                        <option key={dance.id} value={dance.id}>{dance.name}</option>
                    ))}
                </select>
            </div>
            <div className="flex gap-3 pt-4">
                <button 
                    type="button" 
                    onClick={() => { setIsAddModalOpen(false); setUploadFile(null); }}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Отмена
                </button>
                <button 
                    type="submit" 
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Загрузить
                </button>
            </div>
        </form>
      </Modal>
    </div>
  );
};

export default MusicLibrary;

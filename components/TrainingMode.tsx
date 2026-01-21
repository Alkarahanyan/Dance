
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { Dance, DanceElement, Difficulty, MusicTrackMetadata } from '../types.ts';
import { speak } from '../services/geminiService.ts';
import { play } from '../services/audioPlayer.ts';
import { CheckIcon } from './icons/CheckIcon.tsx';
import * as musicDb from '../services/musicDb.ts';

interface TrainingModeProps {
  dances: Dance[];
  musicTracks: MusicTrackMetadata[];
}

const difficultyFilters: { id: Difficulty | 'all', label: string }[] = [
    { id: 'all', label: 'Все' },
    { id: 'easy', label: 'Легкие' },
    { id: 'medium', label: 'Средние' },
    { id: 'hard', label: 'Сложные' },
];

const TrainingMode: React.FC<TrainingModeProps> = ({ dances, musicTracks }) => {
  const [selectedDanceId, setSelectedDanceId] = useState<string>(dances[0]?.id || '');
  const [selectedElementIds, setSelectedElementIds] = useState<Set<string>>(new Set());
  const [intervalSeconds, setIntervalSeconds] = useState(8); 
  const [selectedMusicId, setSelectedMusicId] = useState<string>('');
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [currentElement, setCurrentElement] = useState<DanceElement | null>(null);
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'all'>('all');
  const [isWarmup, setIsWarmup] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const intervalRef = useRef<number | null>(null);
  const warmupTimeoutRef = useRef<number | null>(null);

  const selectedDance = dances.find(d => d.id === selectedDanceId);

  const filteredElements = useMemo(() => {
    if (!selectedDance) return [];
    if (difficultyFilter === 'all') return selectedDance.elements;
    return selectedDance.elements.filter(el => el.difficulty === difficultyFilter);
  }, [selectedDance, difficultyFilter]);

  useEffect(() => {
    const loadMusic = async () => {
      if (!selectedMusicId) {
        if (musicUrl) URL.revokeObjectURL(musicUrl);
        setMusicUrl(null);
        return;
      }
      
      const fullTrack = await musicDb.getTrack(selectedMusicId);
      if (fullTrack) {
        if (musicUrl) URL.revokeObjectURL(musicUrl);
        const url = URL.createObjectURL(fullTrack.blob);
        setMusicUrl(url);
      }
    };
    loadMusic();
  }, [selectedMusicId]);

  useEffect(() => {
    if (!dances.find(d => d.id === selectedDanceId)) {
      setSelectedDanceId(dances[0]?.id || '');
    }
  }, [dances, selectedDanceId]);

  const handleElementToggle = (elementId: string) => {
    setSelectedElementIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(elementId)) newSet.delete(elementId);
      else newSet.add(elementId);
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allIds = new Set(filteredElements.map(e => e.id));
    setSelectedElementIds(allIds);
  };
  
  const handleDeselectAll = () => {
    setSelectedElementIds(new Set());
  };

  const announceRandomElement = useCallback(async () => {
    const activeElements = selectedDance?.elements.filter(el => selectedElementIds.has(el.id)) || [];
    if (activeElements.length === 0) return;

    const randomElement = activeElements[Math.floor(Math.random() * activeElements.length)];

    if (randomElement) {
      setCurrentElement(randomElement);
      setIsLoadingTTS(true);
      setError(null);
      try {
        const base64Audio = await speak(randomElement.name);
        await play(base64Audio);
      } catch (err) {
        console.error("Error with TTS:", err);
        setError("Не удалось воспроизвести название элемента.");
      } finally {
        setIsLoadingTTS(false);
      }
    }
  }, [selectedElementIds, selectedDance]);

  const handleStartTraining = () => {
    if (!musicUrl) { setError("Пожалуйста, выберите музыку из медиатеки."); return; }
    if (selectedElementIds.size === 0) { setError("Пожалуйста, выберите хотя бы один элемент для тренировки."); return; }
    
    setError(null);
    setIsTraining(true);
    setIsWarmup(true);

    setTimeout(() => {
        audioRef.current?.play();
    }, 100);

    warmupTimeoutRef.current = window.setTimeout(() => {
        setIsWarmup(false);
        announceRandomElement();
        intervalRef.current = window.setInterval(announceRandomElement, intervalSeconds * 1000);
    }, 20000); 
  };

  const handleStopTraining = () => {
    setIsTraining(false);
    setIsWarmup(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (warmupTimeoutRef.current) clearTimeout(warmupTimeoutRef.current);
    audioRef.current?.pause();
    setCurrentElement(null);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (warmupTimeoutRef.current) clearTimeout(warmupTimeoutRef.current);
      if (musicUrl) URL.revokeObjectURL(musicUrl);
    };
  }, [musicUrl]);
  
  useEffect(() => {
    setSelectedElementIds(new Set());
    setDifficultyFilter('all');
  }, [selectedDanceId]);


  if (isTraining) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-2xl shadow-2xl h-[60vh] text-center relative overflow-hidden">
        {isWarmup && (
            <div className="absolute inset-0 bg-cyan-900/20 flex flex-col items-center justify-center backdrop-blur-sm z-10">
                <p className="text-3xl font-bold text-cyan-400 animate-pulse mb-2">РАЗМИНКА</p>
                <p className="text-gray-300">Приготовьтесь, команды начнутся через несколько секунд...</p>
            </div>
        )}
        
        <h2 className="text-2xl font-semibold text-gray-400 mb-4">Сейчас выполняем:</h2>
        <p className={`text-5xl font-bold transition-opacity duration-500 ${isLoadingTTS ? 'text-gray-500 animate-pulse' : 'text-cyan-400'}`}>
          {currentElement?.name || "..."}
        </p>
        
        {isLoadingTTS && <p className="mt-4 text-yellow-400">Голосовой помощник говорит...</p>}
        {error && <p className="mt-4 text-red-400">{error}</p>}
        
        <div className="mt-auto w-full">
            {musicUrl && <audio ref={audioRef} src={musicUrl} controls className="w-full opacity-50 hover:opacity-100 transition-opacity" />}
            <button onClick={handleStopTraining} className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 shadow-xl">
                Остановить тренировку
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold tracking-tight text-center text-cyan-400">Режим тренировки</h2>
      {error && <div className="bg-red-900 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-center">{error}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg space-y-6">
          <h3 className="text-xl font-semibold border-b border-gray-700 pb-2 text-gray-300">1. Настройки</h3>
          <div>
            <label htmlFor="dance-select" className="block text-sm font-medium text-gray-400 mb-2">Выберите танец</label>
            <select id="dance-select" value={selectedDanceId} onChange={e => setSelectedDanceId(e.target.value)} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5" disabled={dances.length === 0}>
              {dances.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="interval-input" className="block text-sm font-medium text-gray-400 mb-2">Интервал команд (секунд)</label>
            <input type="number" id="interval-input" value={intervalSeconds} onChange={e => setIntervalSeconds(Math.max(1, parseInt(e.target.value, 10)))} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5" />
            <p className="text-[10px] text-gray-500 mt-1">* Рекомендуемый интервал: 8 секунд</p>
          </div>
          <div>
            <label htmlFor="music-select" className="block text-sm font-medium text-gray-400 mb-2">Музыка из медиатеки</label>
            <select 
              id="music-select" 
              value={selectedMusicId} 
              onChange={e => setSelectedMusicId(e.target.value)} 
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5"
            >
              <option value="">Выберите трек...</option>
              {musicTracks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {musicTracks.length === 0 && <p className="text-xs text-yellow-400 mt-2">Сначала добавьте музыку во вкладке "Музыка".</p>}
          </div>
          <div className="p-3 bg-cyan-900/20 border border-cyan-800/50 rounded-lg">
             <p className="text-xs text-cyan-300">
                <span className="font-bold">Инфо:</span> Команды начнутся через 20 секунд после запуска музыки, чтобы вы успели войти в ритм.
             </p>
          </div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-semibold border-b border-gray-700 pb-2 mb-4 text-gray-300">2. Выберите элементы</h3>
          {selectedDance ? (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                  {difficultyFilters.map(filter => (
                      <button key={filter.id} onClick={() => setDifficultyFilter(filter.id)} className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${difficultyFilter === filter.id ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{filter.label}</button>
                  ))}
              </div>
              <div className="flex space-x-2 mb-4">
                  <button onClick={handleSelectAll} className="bg-gray-700 hover:bg-gray-600 text-xs font-semibold py-1 px-3 rounded-full">Выбрать все</button>
                  <button onClick={handleDeselectAll} className="bg-gray-700 hover:bg-gray-600 text-xs font-semibold py-1 px-3 rounded-full">Снять все</button>
              </div>
              <div className="max-h-80 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {filteredElements.length > 0 ? filteredElements.map(element => (
                  <label key={element.id} className="flex items-center p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                    <div className="relative flex items-center">
                        <input type="checkbox" checked={selectedElementIds.has(element.id)} onChange={() => handleElementToggle(element.id)} className="sr-only peer" />
                        <div className="w-5 h-5 bg-gray-600 rounded-md peer-checked:bg-cyan-500 flex-shrink-0 flex items-center justify-center">
                            {selectedElementIds.has(element.id) && <CheckIcon className="w-4 h-4 text-white"/>}
                        </div>
                        <span className="ml-3 text-white">{element.name}</span>
                    </div>
                  </label>
                )) : <p className="text-gray-400 text-center py-4">Нет элементов с такой сложностью.</p>}
              </div>
            </>
          ) : <p className="text-gray-400 text-center py-4">Выберите танец, чтобы увидеть элементы.</p>}
        </div>
      </div>
      <div className="mt-8 flex justify-center">
        <button onClick={handleStartTraining} disabled={!musicUrl || selectedElementIds.size === 0} className="w-full max-w-md bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-lg text-lg transition-transform transform hover:scale-105 shadow-lg">
          Начать тренировку
        </button>
      </div>
    </div>
  );
};

export default TrainingMode;

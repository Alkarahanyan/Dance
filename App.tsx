
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DanceLibrary from './components/DanceLibrary';
import TrainingMode from './components/TrainingMode';
import MusicLibrary from './components/MusicLibrary';
import { initialDances } from './data/dances';
import type { Dance, DanceElement, Difficulty, MusicTrackMetadata } from './types';
import * as musicDb from './services/musicDb';

export type View = 'library' | 'training' | 'music';

type ElementData = { name: string; description: string; difficulty: Difficulty; videoFile?: File };

const App: React.FC = () => {
  const [view, setView] = useState<View>('library');
  const [musicTracks, setMusicTracks] = useState<MusicTrackMetadata[]>([]);
  
  const [dances, setDances] = useState<Dance[]>(() => {
    try {
      const savedDances = localStorage.getItem('latin-trainer-dances');
      if (savedDances) {
        const parsedDances = JSON.parse(savedDances);
        return parsedDances.map((dance: Dance) => ({
          ...dance,
          elements: dance.elements.map((el: DanceElement) => ({ ...el, videoUrl: undefined }))
        }));
      }
      return initialDances;
    } catch (error) {
      console.error("Could not parse dances from localStorage", error);
      return initialDances;
    }
  });

  useEffect(() => {
    const loadMusic = async () => {
      const metadata = await musicDb.getAllMetadata();
      setMusicTracks(metadata);
    };
    loadMusic();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('latin-trainer-dances', JSON.stringify(dances));
    } catch (error) {
      console.error("Could not save dances to localStorage", error);
    }
  }, [dances]);

  const handleAddDance = (danceName: string) => {
    if (danceName.trim() === '') return;
    const newDance: Dance = {
      id: `dance-${Date.now()}`,
      name: danceName.trim(),
      elements: [],
    };
    setDances(prev => [...prev, newDance]);
  };

  const handleAddElement = (danceId: string, newElementData: ElementData) => {
    const { name, description, videoFile, difficulty } = newElementData;
    if (name.trim() === '') return;

    const newElement: DanceElement = {
      id: `element-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      difficulty,
    };

    if (videoFile) {
      newElement.videoUrl = URL.createObjectURL(videoFile);
    }

    setDances(prevDances => 
      prevDances.map(dance => {
        if (dance.id === danceId) {
          return {
            ...dance,
            elements: [...dance.elements, newElement],
          };
        }
        return dance;
      })
    );
  };

  const handleEditElement = (danceId: string, elementId: string, updatedData: ElementData) => {
     setDances(prevDances => 
      prevDances.map(dance => {
        if (dance.id === danceId) {
          return {
            ...dance,
            elements: dance.elements.map(el => {
              if (el.id === elementId) {
                const updatedElement = {
                  ...el,
                  name: updatedData.name,
                  description: updatedData.description,
                  difficulty: updatedData.difficulty,
                };
                if (updatedData.videoFile) {
                  if (el.videoUrl) URL.revokeObjectURL(el.videoUrl);
                  updatedElement.videoUrl = URL.createObjectURL(updatedData.videoFile);
                }
                return updatedElement;
              }
              return el;
            })
          };
        }
        return dance;
      })
    );
  };

  const handleDeleteElement = (danceId: string, elementId: string) => {
    setDances(prevDances => 
      prevDances.map(dance => {
        if (dance.id === danceId) {
          const elementToDelete = dance.elements.find(el => el.id === elementId);
          if (elementToDelete && elementToDelete.videoUrl) {
            URL.revokeObjectURL(elementToDelete.videoUrl);
          }
          return {
            ...dance,
            elements: dance.elements.filter(el => el.id !== elementId),
          };
        }
        return dance;
      })
    );
  };

  const handleAddMusic = async (file: File, danceId: string) => {
    const id = `music-${Date.now()}`;
    await musicDb.saveTrack({ id, name: file.name, blob: file, danceId });
    setMusicTracks(prev => [...prev, { id, name: file.name, danceId }]);
  };

  const handleDeleteMusic = async (id: string) => {
    await musicDb.deleteTrack(id);
    setMusicTracks(prev => prev.filter(t => t.id !== id));
  };


  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <Header currentView={view} setView={setView} />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {view === 'library' && <DanceLibrary 
          dances={dances} 
          onAddDance={handleAddDance} 
          onAddElement={handleAddElement}
          onEditElement={handleEditElement}
          onDeleteElement={handleDeleteElement}
        />}
        {view === 'training' && <TrainingMode dances={dances} musicTracks={musicTracks} />}
        {view === 'music' && (
          <MusicLibrary 
            tracks={musicTracks} 
            dances={dances}
            onAddTrack={handleAddMusic} 
            onDeleteTrack={handleDeleteMusic} 
          />
        )}
      </main>
    </div>
  );
};

export default App;


import React, { useState, useEffect, useMemo } from 'react';
import type { Dance, DanceElement, Difficulty } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';

const difficultyMap: Record<Difficulty, { label: string; color: string }> = {
  easy: { label: 'Легкий', color: 'bg-green-600' },
  medium: { label: 'Средний', color: 'bg-yellow-600' },
  hard: { label: 'Сложный', color: 'bg-red-600' },
};
const difficultyOrder: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };

// --- Modal Component ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
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


// --- Add/Edit Element Form (used in Modal) ---
type ElementFormData = { name: string; description: string; difficulty: Difficulty; videoFile?: File };
interface ElementFormProps {
    danceId: string;
    element?: DanceElement | null;
    onSave: (danceId: string, data: ElementFormData) => void;
    onClose: () => void;
}

const ElementForm: React.FC<ElementFormProps> = ({ danceId, element, onSave, onClose }) => {
    const [name, setName] = useState(element?.name || '');
    const [description, setDescription] = useState(element?.description || '');
    const [difficulty, setDifficulty] = useState<Difficulty>(element?.difficulty || 'easy');
    const [videoFile, setVideoFile] = useState<File | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(danceId, { name, description, difficulty, videoFile: videoFile || undefined });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Название элемента" required className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5" />
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Описание" required className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5 min-h-[60px]" />
            <div>
              <label htmlFor="difficulty-select" className="block text-sm font-medium text-gray-400 mb-2">Сложность</label>
              <select id="difficulty-select" value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5">
                {(Object.keys(difficultyMap) as Difficulty[]).map(key => (
                  <option key={key} value={key}>{difficultyMap[key].label}</option>
                ))}
              </select>
            </div>
            <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files ? e.target.files[0] : null)} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 cursor-pointer"/>
            <div className="flex gap-2 pt-2">
                <button type="button" onClick={onClose} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Отмена</button>
                <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg">Сохранить</button>
            </div>
        </form>
    );
};

// --- Main Library Component ---
type SortOrder = 'default' | 'difficulty-asc' | 'difficulty-desc';
interface DanceLibraryProps {
  dances: Dance[];
  onAddDance: (name: string) => void;
  onAddElement: (danceId: string, data: ElementFormData) => void;
  onEditElement: (danceId: string, elementId: string, data: ElementFormData) => void;
  onDeleteElement: (danceId: string, elementId: string) => void;
}

const DanceLibrary: React.FC<DanceLibraryProps> = ({ dances, onAddDance, onAddElement, onEditElement, onDeleteElement }) => {
  const [selectedDance, setSelectedDance] = useState<Dance | null>(dances[0] || null);
  const [isAddDanceModalOpen, setAddDanceModalOpen] = useState(false);
  const [newDanceName, setNewDanceName] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('default');
  
  const [elementToEdit, setElementToEdit] = useState<DanceElement | null>(null);
  const [isElementModalOpen, setElementModalOpen] = useState(false);
  
  useEffect(() => {
      if(selectedDance && !dances.find(d => d.id === selectedDance.id)) {
          setSelectedDance(dances[0] || null);
      } else if (!selectedDance && dances.length > 0) {
          setSelectedDance(dances[0]);
      }
  }, [dances, selectedDance]);

  const sortedElements = useMemo(() => {
    if (!selectedDance) return [];
    const elements = [...selectedDance.elements];
    if (sortOrder === 'difficulty-asc') {
        return elements.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
    }
    if (sortOrder === 'difficulty-desc') {
        return elements.sort((a, b) => difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty]);
    }
    return elements;
  }, [selectedDance, sortOrder]);

  const handleAddDanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddDance(newDanceName);
    setNewDanceName('');
    setAddDanceModalOpen(false);
  };

  const handleDeleteClick = (danceId: string, elementId: string, elementName: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить элемент "${elementName}"?`)) {
        onDeleteElement(danceId, elementId);
    }
  };

  const handleSaveElement = (danceId: string, data: ElementFormData) => {
    if(elementToEdit) {
        onEditElement(danceId, elementToEdit.id, data);
    } else {
        onAddElement(danceId, data);
    }
  };

  return (
    <>
      <div className="space-y-8">
        <h2 className="text-3xl font-bold tracking-tight text-center text-cyan-400">Библиотека движений</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <aside className="md:col-span-1">
            <h3 className="text-xl font-semibold mb-4 text-gray-300">Танцы</h3>
            <ul className="space-y-2">
              {dances.map((dance) => (
                <li key={dance.id}>
                  <button onClick={() => setSelectedDance(dance)} className={`w-full text-left px-4 py-2 rounded-lg transition-colors duration-200 ${selectedDance?.id === dance.id ? 'bg-cyan-600 text-white font-semibold' : 'bg-gray-800 hover:bg-gray-700'}`}>
                    {dance.name}
                  </button>
                </li>
              ))}
               <li>
                <button onClick={() => setAddDanceModalOpen(true)} className="w-full mt-2 flex items-center justify-center px-4 py-4 rounded-lg border-2 border-dashed border-gray-600 hover:border-cyan-500 hover:text-cyan-500 text-gray-500 transition-colors duration-200">
                    <PlusIcon className="w-8 h-8"/>
                </button>
              </li>
            </ul>
          </aside>
          <section className="md:col-span-3">
            {selectedDance ? (
              <div>
                <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                    <h3 className="text-2xl font-semibold text-gray-300">{selectedDance.name} - Элементы</h3>
                    <div className="flex items-center gap-4">
                         <select value={sortOrder} onChange={e => setSortOrder(e.target.value as SortOrder)} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2">
                            <option value="default">Сортировка: по умолчанию</option>
                            <option value="difficulty-asc">Сложность: по возрастанию</option>
                            <option value="difficulty-desc">Сложность: по убыванию</option>
                        </select>
                        <button onClick={() => { setElementToEdit(null); setElementModalOpen(true); }} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg text-sm">
                            <PlusIcon className="w-4 h-4"/> Добавить
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {sortedElements.map((element) => (
                    <div key={element.id} className="bg-gray-800 p-4 rounded-xl shadow-lg flex flex-col sm:flex-row gap-4 relative group transition-all hover:bg-gray-750">
                      
                      {/* Video Preview Window */}
                      {element.videoUrl ? (
                        <div className="w-full sm:w-48 h-32 flex-shrink-0 bg-black rounded-lg overflow-hidden relative group/video">
                           <video 
                              src={element.videoUrl} 
                              className="w-full h-full object-cover"
                              muted
                              loop
                              onMouseOver={e => (e.target as HTMLVideoElement).play()}
                              onMouseOut={e => {
                                const v = (e.target as HTMLVideoElement);
                                v.pause();
                                v.currentTime = 0;
                              }}
                           />
                           <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover/video:hidden pointer-events-none">
                              <div className="w-8 h-8 bg-cyan-500/80 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                              </div>
                           </div>
                           <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 px-1 rounded text-white font-mono uppercase tracking-tighter">Preview</span>
                        </div>
                      ) : (
                        <div className="w-full sm:w-48 h-32 flex-shrink-0 bg-gray-700 rounded-lg flex items-center justify-center text-gray-500 italic text-sm border border-gray-600 border-dashed">
                           Нет видео
                        </div>
                      )}

                      {/* Content Area */}
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                             <h4 className="font-bold text-xl text-cyan-400">{element.name}</h4>
                             <span className={`px-2 py-0.5 text-xs font-semibold text-white rounded-full ${difficultyMap[element.difficulty].color}`}>
                                {difficultyMap[element.difficulty].label}
                             </span>
                          </div>
                          <p className="text-gray-400 text-sm line-clamp-3 mb-2 pr-20">{element.description}</p>
                        </div>
                        
                        {/* Action Buttons (Integrated) */}
                        <div className="flex gap-4 items-center mt-auto border-t border-gray-700 pt-3">
                            {element.videoUrl && (
                                <button 
                                    onClick={() => {
                                        const videoModal = document.createElement('div');
                                        videoModal.className = "fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4";
                                        videoModal.innerHTML = `<div class="max-w-4xl w-full relative"><video src="${element.videoUrl}" controls autoplay class="w-full rounded-lg"></video><button class="absolute -top-10 right-0 text-white text-3xl">&times;</button></div>`;
                                        videoModal.onclick = (e) => { if(e.target === videoModal || (e.target as HTMLElement).tagName === 'BUTTON') document.body.removeChild(videoModal); };
                                        document.body.appendChild(videoModal);
                                    }}
                                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-wider"
                                >
                                    Смотреть в полный экран
                                </button>
                            )}
                        </div>
                      </div>

                      {/* Absolute Icons for Control */}
                      <div className="absolute top-4 right-4 flex gap-2">
                          <button onClick={() => {setElementToEdit(element); setElementModalOpen(true);}} className="p-2 bg-gray-700 hover:bg-cyan-600 rounded-lg text-gray-300 hover:text-white transition-all transform hover:scale-110 shadow-md">
                              <EditIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteClick(selectedDance.id, element.id, element.name)} className="p-2 bg-gray-700 hover:bg-red-600 rounded-lg text-gray-300 hover:text-white transition-all transform hover:scale-110 shadow-md">
                              <TrashIcon className="w-4 h-4" />
                          </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-800 rounded-lg border-2 border-dashed border-gray-700 min-h-[400px]">
                <p className="text-gray-400 text-lg">Выберите или добавьте танец для просмотра элементов.</p>
              </div>
            )}
          </section>
        </div>
      </div>
      
      <Modal isOpen={isAddDanceModalOpen} onClose={() => setAddDanceModalOpen(false)} title="Добавить новый танец">
        <form onSubmit={handleAddDanceSubmit} className="flex gap-2">
           <input type="text" value={newDanceName} onChange={(e) => setNewDanceName(e.target.value)} placeholder="Название танца" required className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2"/>
           <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg">Сохранить</button>
        </form>
      </Modal>

      <Modal isOpen={isElementModalOpen} onClose={() => { setElementModalOpen(false); setElementToEdit(null); }} title={elementToEdit ? 'Редактировать элемент' : 'Добавить новый элемент'}>
        {selectedDance && (
            <ElementForm 
                danceId={selectedDance.id}
                element={elementToEdit}
                onSave={handleSaveElement}
                onClose={() => { setElementModalOpen(false); setElementToEdit(null); }}
            />
        )}
      </Modal>
    </>
  );
};

export default DanceLibrary;

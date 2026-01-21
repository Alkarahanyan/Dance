
import React from 'react';
import { View } from '../App.tsx';

interface HeaderProps {
  currentView: View;
  setView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView }) => {
  const navItems: { id: View; label: string }[] = [
    { id: 'training', label: 'Тренировка' },
    { id: 'library', label: 'Библиотека' },
    { id: 'music', label: 'Музыка' },
  ];

  return (
    <header className="bg-gray-800 shadow-md sticky top-0 z-10">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-cyan-400 tracking-wider">LATIN TRAINER</h1>
          </div>
          <div className="flex items-baseline space-x-2 sm:space-x-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                  currentView === item.id
                    ? 'bg-cyan-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;

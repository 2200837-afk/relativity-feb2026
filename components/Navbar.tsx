
import React from 'react';
import { ViewMode, NavItem } from '../types';
import { Rocket, BookOpen, Atom, FlaskConical, Home, GraduationCap, BarChart3, ClipboardPen, LogOut } from 'lucide-react';

interface NavbarProps {
  currentMode: ViewMode;
  setMode: (mode: ViewMode) => void;
  onExit?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentMode, setMode, onExit }) => {
  const items: NavItem[] = [
    { id: ViewMode.HOME, label: 'Home', icon: <Home size={18} /> },
    { id: ViewMode.THEORY, label: 'Theory', icon: <BookOpen size={18} /> },
    { id: ViewMode.SIMULATION, label: 'Warp Drive Sandbox', icon: <Rocket size={18} /> },
    { id: ViewMode.EXPERIMENTS, label: 'Experiments', icon: <FlaskConical size={18} /> },
    { id: ViewMode.QUIZ, label: 'Quiz', icon: <GraduationCap size={18} /> },
    { id: ViewMode.FEEDBACK, label: 'Feedback', icon: <ClipboardPen size={18} /> },
    { id: ViewMode.RESEARCH, label: 'Research', icon: <BarChart3 size={18} /> },
  ];

  return (
    <nav className="border-b border-space-700 bg-space-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={onExit ? onExit : () => setMode(ViewMode.HOME)}>
            <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)] group-hover:shadow-[0_0_25px_rgba(6,182,212,0.8)] transition-all duration-300">
               <Atom size={20} className="text-white animate-spin-slow" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Relativity<span className="font-light text-cyan-400">InMotion</span>
            </span>
          </div>

          <div className="flex gap-1 bg-space-800 p-1 rounded-lg border border-space-700 overflow-x-auto no-scrollbar">
            {items.map((item) => {
              const isActive = currentMode === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setMode(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-300 text-sm font-medium whitespace-nowrap group relative ${
                    isActive
                      ? 'bg-space-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : 'text-slate-400 hover:text-white hover:bg-space-700/50'
                  }`}
                >
                  <div className={`transition-all duration-300 transform ${isActive ? 'scale-110 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'group-hover:scale-110 group-hover:text-slate-200'}`}>
                    {item.icon}
                  </div>
                  <span className={`hidden sm:inline transition-colors duration-300 ${isActive ? 'text-white' : 'group-hover:text-white'}`}>
                    {item.label}
                  </span>
                  
                  {/* Active Indicator Underline */}
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-in fade-in zoom-in duration-300"></div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex ml-4">
             <button 
               onClick={onExit}
               className="p-2 text-slate-500 hover:text-red-400 transition-all duration-300 rounded-lg hover:bg-red-500/10 group"
               title="Exit Research Session"
             >
                <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
             </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
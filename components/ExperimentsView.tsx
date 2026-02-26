import React, { useState } from 'react';
import { ExpDoppler } from './ExpDoppler';
import { ExpSimultaneity } from './ExpSimultaneity';
import { ExpTwin } from './ExpTwin';
import { ExpTrainTunnel } from './ExpTrainTunnel';
import { ArrowLeft, Radio, TrainFront, Users, Zap, ArrowRight } from 'lucide-react';
import { ViewMode } from '../types';
import { Button } from './Button';

type ExperimentType = 'DOPPLER' | 'SIMULTANEITY' | 'TWIN' | 'TRAIN' | null;

interface ExperimentsViewProps {
  setMode?: (mode: ViewMode) => void;
}

export const ExperimentsView: React.FC<ExperimentsViewProps> = ({ setMode }) => {
  const [activeExp, setActiveExp] = useState<ExperimentType>(null);

  const experiments = [
    {
      id: 'DOPPLER',
      title: 'Doppler Shift',
      desc: 'Visualize how light changes color as you approach the speed of light.',
      icon: <Zap className="text-yellow-400" size={32} />,
      color: 'hover:border-yellow-500/50'
    },
    {
      id: 'SIMULTANEITY',
      title: 'Simultaneity',
      desc: 'Why "now" means something different for moving observers.',
      icon: <Radio className="text-green-400" size={32} />,
      color: 'hover:border-green-500/50'
    },
    {
      id: 'TWIN',
      title: 'Twin Paradox',
      desc: 'Calculate how much younger a space traveler returns compared to their twin.',
      icon: <Users className="text-purple-400" size={32} />,
      color: 'hover:border-purple-500/50'
    },
    {
      id: 'TRAIN',
      title: 'Train & Tunnel',
      desc: 'Can a long train fit in a short tunnel? Exploring length contraction.',
      icon: <TrainFront className="text-cyan-400" size={32} />,
      color: 'hover:border-cyan-500/50'
    }
  ];

  const renderActiveExperiment = () => {
    switch (activeExp) {
        case 'DOPPLER': return <ExpDoppler />;
        case 'SIMULTANEITY': return <ExpSimultaneity />;
        case 'TWIN': return <ExpTwin />;
        case 'TRAIN': return <ExpTrainTunnel />;
        default: return null;
    }
  };

  if (activeExp) {
    return (
        <div className="max-w-4xl mx-auto px-4">
            <button 
                onClick={() => setActiveExp(null)}
                className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft size={20} /> Back to Experiments
            </button>
            {renderActiveExperiment()}
        </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="text-center mb-20 relative">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] -z-10"></div>
        <h1 className="text-6xl font-black text-white mb-6 tracking-tighter uppercase">
            Thought <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Experiments</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Einstein used "Gedankenexperiments" to uncover the secrets of the universe. 
            Select a paradox below to manifest it in your physical space.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        {experiments.map((exp, idx) => (
            <div 
                key={exp.id}
                onClick={() => setActiveExp(exp.id as ExperimentType)}
                className={`group relative bg-space-800/40 backdrop-blur-xl p-10 rounded-[40px] border border-white/10 cursor-pointer transition-all duration-500 hover:-translate-y-4 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] ${exp.color}`}
            >
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="flex items-start justify-between mb-10 relative z-10">
                    <div className="p-6 bg-black/40 rounded-[24px] border border-white/10 group-hover:border-white/30 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 shadow-inner">
                        {exp.icon}
                    </div>
                    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-slate-500 group-hover:text-cyan-400 group-hover:border-cyan-500/50 transition-all duration-500">
                        <ArrowLeft className="rotate-180" size={24} />
                    </div>
                </div>

                <div className="relative z-10">
                    <h3 className="text-3xl font-black text-white mb-4 tracking-tight uppercase group-hover:text-cyan-400 transition-colors">{exp.title}</h3>
                    <p className="text-lg text-slate-400 leading-relaxed font-medium group-hover:text-slate-300 transition-colors">{exp.desc}</p>
                </div>

                {/* Pop-out element (Visual only) */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="mt-10 flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] opacity-50 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-px bg-slate-700"></div>
                    Paradox_0{idx + 1}
                </div>
            </div>
        ))}
      </div>

      {/* Next Step Guidance */}
      <div className="mt-24 pt-12 border-t border-white/5 flex flex-col items-center gap-6">
        <div className="text-center">
          <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Test Your Knowledge</h3>
          <p className="text-slate-400 font-medium">Ready to validate your understanding of relativistic paradoxes?</p>
        </div>
        <Button 
          size="lg" 
          onClick={() => setMode?.(ViewMode.QUIZ)}
          className="h-16 px-12 rounded-2xl flex items-center gap-3 group text-lg font-black uppercase tracking-widest shadow-[0_0_30px_rgba(6,182,212,0.3)]"
        >
          Next: Aptitude Quiz <ArrowRight className="group-hover:translate-x-2 transition-transform" />
        </Button>
      </div>
    </div>
  );
};
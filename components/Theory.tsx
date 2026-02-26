import React from 'react';
import { Clock, Ruler, Zap, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { ViewMode } from '../types';
import { Button } from './Button';
import { motion } from 'motion/react';

interface TheoryProps {
  setMode?: (mode: ViewMode) => void;
}

export const Theory: React.FC<TheoryProps> = ({ setMode }) => {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-24 animate-in fade-in duration-1000 py-12">
      
      {/* Hero Section */}
      <div className="relative text-center space-y-8 py-12">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-cyan-500/5 blur-[120px] rounded-full"></div>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-black text-cyan-400 uppercase tracking-[0.3em] mb-8">
            <Sparkles size={14} /> Theoretical_Foundation
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tighter uppercase leading-none">
            Special <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Relativity</span>
          </h1>
          <p className="text-2xl text-slate-400 font-medium max-w-3xl mx-auto leading-relaxed italic">
            "The Two Postulates that Broke Physics and Redefined our Reality (1905)"
          </p>
        </motion.div>
      </div>

      {/* Postulates Grid */}
      <div className="grid lg:grid-cols-2 gap-12">
        <motion.div 
          whileHover={{ y: -10, scale: 1.02 }}
          className="relative group perspective-1000"
        >
          <div className="absolute -inset-1 bg-gradient-to-tr from-cyan-500 to-transparent rounded-[40px] blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative bg-space-800/40 backdrop-blur-2xl p-12 rounded-[40px] border border-white/10 shadow-2xl h-full flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 text-[12rem] font-black text-white/5 -translate-y-12 translate-x-12 select-none">01</div>
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 mb-8 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                <BookOpen size={32} />
              </div>
              <h3 className="text-3xl font-black text-white mb-6 uppercase tracking-tight">The Principle of Relativity</h3>
              <p className="text-slate-400 leading-relaxed text-xl font-medium italic">
                "There is no 'absolute rest.' Physics works exactly the same in any inertial frame. You cannot tell if you are moving or standing still without looking outside."
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -10, scale: 1.02 }}
          className="relative group perspective-1000"
        >
          <div className="absolute -inset-1 bg-gradient-to-tr from-purple-500 to-transparent rounded-[40px] blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative bg-space-800/40 backdrop-blur-2xl p-12 rounded-[40px] border border-white/10 shadow-2xl h-full flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 text-[12rem] font-black text-white/5 -translate-y-12 translate-x-12 select-none">02</div>
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-8 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                <Zap size={32} />
              </div>
              <h3 className="text-3xl font-black text-white mb-6 uppercase tracking-tight">The Speed of Light (c)</h3>
              <p className="text-slate-400 leading-relaxed text-xl font-medium italic">
                "Light always travels at 299,792,458 m/s. It is the universal speed limit, constant for all observers regardless of their motion."
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Consequences Section */}
      <div className="space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter">The Consequences</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 mx-auto rounded-full"></div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Clock, title: "Time Dilation", color: "text-cyan-400", desc: "Moving clocks tick slower. Time is personal, not universal.", border: "border-cyan-500/20" },
            { icon: Ruler, title: "Length Contraction", color: "text-purple-400", desc: "Moving objects shrink in the direction of motion.", border: "border-purple-500/20" },
            { icon: Zap, title: "Mass Increase", color: "text-yellow-400", desc: "The faster you go, the heavier you get. Reaching 'c' requires infinite energy.", border: "border-yellow-500/20" }
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -8, scale: 1.05 }}
              className={`bg-black/40 backdrop-blur-xl p-10 rounded-[32px] border ${item.border} shadow-2xl group transition-all`}
            >
              <item.icon className={`${item.color} mb-8 group-hover:scale-110 transition-transform`} size={48} />
              <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">{item.title}</h3>
              <p className="text-slate-400 text-lg leading-relaxed font-medium italic">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Next Step Guidance */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="pt-24 border-t border-white/10 flex flex-col items-center gap-12"
      >
        <div className="text-center space-y-4">
          <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Ready to see it in action?</h3>
          <p className="text-xl text-slate-400 font-medium italic">"Move to the Warp Drive Sandbox to interact with these concepts."</p>
        </div>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            size="lg" 
            onClick={() => setMode?.(ViewMode.SIMULATION)}
            className="h-20 px-16 rounded-[24px] flex items-center gap-4 group text-xl font-black uppercase tracking-widest bg-cyan-500 text-black shadow-[0_0_50px_rgba(6,182,212,0.4)] hover:shadow-[0_0_70px_rgba(6,182,212,0.6)] transition-all"
          >
            Next: Warp Drive Sandbox <ArrowRight className="group-hover:translate-x-3 transition-transform" size={24} />
          </Button>
        </motion.div>
      </motion.div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
};

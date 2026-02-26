
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { ViewMode } from '../types';
import { ArrowRight, Clock, TrainFront, Zap, Users, Sparkles, Binary, MoveRight, BookOpen, Rocket, FlaskConical, GraduationCap, ClipboardPen, BarChart3 } from 'lucide-react';

interface HomeProps {
  setMode: (mode: ViewMode) => void;
}

const PARADOXES = [
  {
    id: 1,
    title: "The Twin Paradox",
    subtitle: "Dilation of Biological Time",
    desc: "A stellar journey at relativistic speeds creates a rift in aging. One twin traverses the stars; the other remains on Earth. Upon reunion, their watches—and cells—no longer agree.",
    icon: <Users size={48} className="text-purple-400" />,
    color: "from-purple-900/40 via-blue-900/40 to-space-900",
    accent: "bg-purple-500"
  },
  {
    id: 2,
    title: "Train in a Tunnel",
    subtitle: "Simultaneity of Space",
    desc: "A physical impossibility in Newtonian physics becomes reality. A train longer than its tunnel fits inside entirely—but only from one perspective. Witness the relativity of length.",
    icon: <TrainFront size={48} className="text-cyan-400" />,
    color: "from-cyan-900/40 via-blue-900/40 to-space-900",
    accent: "bg-cyan-500"
  },
  {
    id: 3,
    title: "Time Dilation",
    subtitle: "The Elasticity of Seconds",
    desc: "Time is not a universal clock. It is a personal dimension that stretches and compresses. At 0.99c, minutes for you become hours for the galaxy.",
    icon: <Clock size={48} className="text-pink-400" />,
    color: "from-pink-900/40 via-rose-900/40 to-space-900",
    accent: "bg-pink-500"
  }
];

export const Home: React.FC<HomeProps> = ({ setMode }) => {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % PARADOXES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const activeItem = PARADOXES[activeIdx];

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex flex-col items-center justify-center overflow-hidden bg-space-900">
      
      {/* Cinematic Background Effects */}
      <div className="absolute inset-0 z-0">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_transparent_0%,_#0b0d17_80%)]"></div>
         <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse"></div>
         <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
         
         {/* Moving Stars */}
         <div className="absolute inset-0 opacity-30 animate-[spin-slow_120s_linear_infinite]" style={{backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '60px 60px'}}></div>
         
         {/* Distant Nebula Effect */}
         <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-cyan-900/10 via-transparent to-purple-900/10 pointer-events-none"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-12 gap-16 items-center py-12">
        
        {/* Left Column: Hero Content */}
        <div className="lg:col-span-7 space-y-10 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-[0.2em] uppercase mb-4 animate-in fade-in slide-in-from-left-4 duration-700">
            <Sparkles size={14} /> Exploring the fabric of space-time
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-white animate-in fade-in slide-in-from-left-6 duration-1000">
            Reality is <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500">Relative.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light animate-in fade-in slide-in-from-left-8 duration-1000 delay-200">
            Dive into Einstein's Special Theory of Relativity. 
            Visualize paradoxes that defy common sense through immersive, high-velocity simulations.
          </p>
          
          <div className="grid grid-cols-3 gap-8 pt-12 border-t border-white/5 max-w-lg mx-auto lg:mx-0 opacity-60 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
             <div className="space-y-1">
                <div className="text-2xl font-bold text-white">299k</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">km/s Velocity</div>
             </div>
             <div className="space-y-1">
                <div className="text-2xl font-bold text-white">0.99c</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Warp Limit</div>
             </div>
             <div className="space-y-1">
                <div className="text-2xl font-bold text-white">E=mc²</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Mass-Energy</div>
             </div>
          </div>
        </div>

        {/* Right Column: Interactive Carousel */}
        <div className="lg:col-span-5 relative h-[500px] w-full perspective-1000">
            {PARADOXES.map((item, idx) => {
                const isActive = idx === activeIdx;
                return (
                    <div 
                        key={item.id}
                        className={`absolute inset-0 transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] transform ${
                            isActive 
                            ? 'opacity-100 translate-y-0 scale-100 rotate-0 pointer-events-auto' 
                            : 'opacity-0 translate-y-12 scale-90 rotate-2 pointer-events-none'
                        }`}
                    >
                        <div className={`h-full bg-gradient-to-br ${item.color} border border-white/10 backdrop-blur-xl rounded-[40px] p-10 flex flex-col shadow-2xl relative overflow-hidden group transition-all duration-500 hover:border-white/30`}>
                            <div className={`absolute top-0 right-0 p-40 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 ${item.accent}`}></div>
                            
                            <div className="mb-8 p-5 bg-black/40 rounded-3xl border border-white/10 w-fit shadow-inner">
                                {item.icon}
                            </div>
                            
                            <div className="space-y-2 mb-6">
                              <h2 className="text-4xl font-black text-white">{item.title}</h2>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${item.accent} shadow-[0_0_8px_rgba(255,255,255,0.5)]`}></div>
                                <h3 className="text-lg font-medium text-white/70">{item.subtitle}</h3>
                              </div>
                            </div>

                            <p className="text-slate-300 text-lg leading-relaxed font-light mb-auto">
                                {item.desc}
                            </p>
                            
                            <div className="flex items-center justify-between mt-12">
                                <div className="flex gap-3">
                                    {PARADOXES.map((_, i) => (
                                        <button 
                                            key={i}
                                            onClick={() => setActiveIdx(i)}
                                            className={`h-1.5 rounded-full transition-all duration-500 ${i === activeIdx ? 'w-10 bg-white' : 'w-2 bg-white/20'}`}
                                        />
                                    ))}
                                </div>
                                <div className="text-white/20 font-mono text-sm uppercase tracking-tighter">Paradox_0{item.id}</div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>

      </div>

      {/* Mission Roadmap Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">
            Mission <span className="text-cyan-400">Roadmap</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto font-medium">
            Follow the guided path to master the concepts of Special Relativity through theory, simulation, and research.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { id: ViewMode.THEORY, step: "01", title: "Theory", desc: "Understand the fundamental postulates of Einstein.", icon: <BookOpen size={24} />, color: "from-blue-500/20 to-cyan-500/20" },
            { id: ViewMode.SIMULATION, step: "02", title: "Warp Sandbox", desc: "Interact with time dilation and length contraction.", icon: <Rocket size={24} />, color: "from-cyan-500/20 to-purple-500/20" },
            { id: ViewMode.EXPERIMENTS, step: "03", title: "Experiments", desc: "Explore famous paradoxes in immersive space.", icon: <FlaskConical size={24} />, color: "from-purple-500/20 to-pink-500/20" },
            { id: ViewMode.QUIZ, step: "04", title: "Quiz", desc: "Validate your mastery of relativistic physics.", icon: <GraduationCap size={24} />, color: "from-pink-500/20 to-rose-500/20" },
            { id: ViewMode.FEEDBACK, step: "05", title: "Feedback", desc: "Share your experience to help our research.", icon: <ClipboardPen size={24} />, color: "from-rose-500/20 to-orange-500/20" },
            { id: ViewMode.RESEARCH, step: "06", title: "Research Scheme", desc: "Deep dive into the analytical framework.", icon: <BarChart3 size={24} />, color: "from-orange-500/20 to-yellow-500/20" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setMode(item.id)}
              className="group relative bg-space-800/40 backdrop-blur-xl p-8 rounded-[32px] border border-white/10 text-left transition-all duration-500 hover:-translate-y-4 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] hover:border-white/30 overflow-hidden"
            >
              {/* Fake 3D Pop-out Effect */}
              <div className={`absolute -inset-4 bg-gradient-to-tr ${item.color} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-cyan-500 group-hover:text-black transition-all duration-500 shadow-inner">
                    {item.icon}
                  </div>
                  <span className="text-4xl font-black text-white/5 group-hover:text-white/20 transition-colors duration-500">{item.step}</span>
                </div>
                
                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight group-hover:text-cyan-400 transition-colors">{item.title}</h3>
                <p className="text-slate-400 font-medium leading-relaxed group-hover:text-slate-200 transition-colors">{item.desc}</p>
                
                <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-cyan-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                  Access Module <ArrowRight size={12} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Floating UI element: Current Ship Stats */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-12 px-8 py-4 bg-black/40 backdrop-blur-md rounded-full border border-white/5 animate-bounce">
         <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Inertial Frame: Stable</span>
         </div>
         <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Physics Core: Active</span>
         </div>
         <div className="flex items-center gap-3">
            <Binary size={14} className="text-cyan-400" />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Analysis Engine: Online</span>
         </div>
      </div>
      
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
};

import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { generatePhysicsExplanation } from '../services/geminiService';
import { Button } from './Button';
import { Info, Play, Pause, RotateCcw, Rocket, Layout, Binary, Box, ArrowRight, Sparkles, Zap } from 'lucide-react';
import { usePageTracking, useAnalytics } from '../contexts/AnalyticsContext';
import { ARBookmark } from './ARBookmark';
import { Relativistic3DViewer } from './Relativistic3DViewer';
import { ViewMode } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SimulationProps {
  velocity: number;
  setVelocity: (v: number) => void;
  setMode?: (mode: ViewMode) => void;
}

const LorentzGraph = ({ currentV }: { currentV: number }) => {
  const data = [];
  for (let v = 0; v <= 99; v += 1) {
    const vel = v / 100;
    const g = 1 / Math.sqrt(1 - vel * vel);
    data.push({ v: vel, gamma: g > 10 ? 10 : g });
  }

  return (
    <div className="h-48 w-full mt-4 bg-black/40 rounded-2xl p-4 border border-white/5 shadow-inner">
      <p className="text-[10px] font-black text-slate-500 mb-4 text-center uppercase tracking-[0.3em]">Lorentz_Factor_Analysis</p>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorGamma" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2548" opacity={0.2} />
          <XAxis dataKey="v" stroke="#64748b" tickFormatter={(val) => `${val.toFixed(1)}c`} fontSize={10} />
          <YAxis stroke="#64748b" domain={[1, 10]} fontSize={10} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0b0d17', borderColor: '#1e2548', color: '#fff', borderRadius: '12px' }}
            formatter={(value: number) => [value.toFixed(2), 'Gamma']}
            labelFormatter={(label) => `Velocity: ${label}c`}
          />
          <Area type="monotone" dataKey="gamma" stroke="#06b6d4" fillOpacity={1} fill="url(#colorGamma)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const Simulation: React.FC<SimulationProps> = ({ velocity, setVelocity, setMode }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [explanation, setExplanation] = useState<string>("");
  const [loadingExpl, setLoadingExpl] = useState(false);

  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');

  usePageTracking("WarpDriveSandbox");
  const { trackSlider, trackClick } = useAnalytics();

  const gamma = 1 / Math.sqrt(1 - velocity * velocity);
  const timeDilation = gamma; 

  const handleVelocityChange = (v: number) => {
    setVelocity(v);
  };

  const handleExplain = async () => {
    trackClick("btn-explain-sim");
    setLoadingExpl(true);
    const text = await generatePhysicsExplanation("Time Dilation and Length Contraction", velocity, gamma);
    setExplanation(text);
    setLoadingExpl(false);
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-700 relative space-y-12">
      
      {/* Navigator Cat - Pop-out Assistant */}
      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="fixed bottom-12 right-12 z-[100] hidden lg:block"
      >
        <div className="relative group">
          <div className="absolute -inset-4 bg-cyan-500/20 rounded-full blur-2xl group-hover:bg-cyan-500/40 transition-all duration-500"></div>
          <div className="relative bg-space-800/80 backdrop-blur-2xl border border-white/10 p-6 rounded-[40px] shadow-2xl flex flex-col items-center gap-4 border-b-4 border-cyan-500">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 p-1">
              <div className="w-full h-full rounded-full bg-space-900 flex items-center justify-center overflow-hidden">
                <img 
                  src="https://picsum.photos/seed/spacecat/200/200" 
                  alt="Navigator Cat" 
                  className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">Navigator_Cat</div>
              <div className="text-xs font-bold text-white max-w-[120px]">
                {velocity > 0.9 ? "Hold on tight!" : "Ready for Warp?"}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col gap-12">
        <div className="flex flex-col gap-8 w-full">
          
          {/* Main Viewport Card with "Shocking" 3D effect */}
          <motion.div 
            whileHover={{ rotateX: 1, rotateY: -0.5 }}
            className="perspective-1000 relative group min-h-[500px]"
          >
            {/* Decorative background glow */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-500/10 to-purple-500/10 rounded-[48px] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            <div className="relative w-full h-full bg-space-900 rounded-[40px] overflow-hidden border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] backdrop-blur-xl transform-gpu transition-all duration-700 group-hover:translate-z-10">
              
              {/* View Mode Toggle Overlay - Floating Glassmorphism */}
              <div className="absolute top-6 right-6 z-50 flex bg-black/40 backdrop-blur-2xl rounded-[20px] p-1.5 border border-white/10 shadow-2xl scale-90 md:scale-100">
                  <button 
                    onClick={() => setViewMode('2d')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === '2d' ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.5)]' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Layout size={14} /> Blueprint
                  </button>
                  <button 
                    onClick={() => setViewMode('3d')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === '3d' ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.5)]' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Box size={14} /> Projection
                  </button>
              </div>

              {viewMode === '3d' ? (
                  <div className="w-full h-full">
                    <Relativistic3DViewer velocity={velocity} gamma={gamma} />
                  </div>
              ) : (
                  <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center p-12 relative overflow-hidden">
                      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '48px 48px' }}></div>
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent"></div>
                      
                      <div className="relative z-10 w-full h-full max-w-3xl flex flex-col items-center justify-center">
                          <div className="w-full flex items-center justify-between px-8 mb-12">
                              <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
                                System_Active // Stationary_Frame
                              </div>
                              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Engine_Core: Nominal</div>
                          </div>
                          
                          <div className="relative w-full h-64 border-y border-white/5 flex items-center justify-center overflow-visible">
                              {/* The Ship Representation - Floating with shadow */}
                              <motion.div 
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="h-24 bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-[28px] border border-white/20 flex items-center justify-center transition-all duration-700 relative shadow-[0_40px_80px_rgba(6,182,212,0.4)] z-20"
                                style={{ width: `${100 / gamma}%` }}
                              >
                                  <Rocket className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" size={48} />
                                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl text-xs font-black text-cyan-300 whitespace-nowrap shadow-2xl tracking-widest">
                                    L' = {(100/gamma).toFixed(1)}m
                                  </div>
                              </motion.div>
                              
                              {/* Background Grid movement lines */}
                              <div className="absolute inset-0 flex flex-col justify-around py-12 opacity-20 pointer-events-none overflow-hidden">
                                  {[...Array(8)].map((_, i) => (
                                     <div key={i} className="h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent w-[200%] animate-[slide_2s_linear_infinite]" style={{ animationDuration: `${0.2 + (1-velocity)}s` }}></div>
                                  ))}
                              </div>
                          </div>

                          <div className="mt-16 grid grid-cols-3 gap-16 w-full">
                              <div className="text-center group/stat">
                                  <div className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em] mb-3 group-hover/stat:text-slate-300 transition-colors">Observer_Time</div>
                                  <div className="text-5xl font-black text-white tracking-tighter">1.00<span className="text-sm text-slate-600 ml-1">s</span></div>
                              </div>
                              <div className="text-center group/stat">
                                   <div className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em] mb-3 group-hover/stat:text-slate-300 transition-colors">Velocity_Vector</div>
                                   <div className="text-5xl font-black text-cyan-400 tracking-tighter">{(velocity * 100).toFixed(1)}<span className="text-sm text-cyan-900 ml-1">%c</span></div>
                              </div>
                              <div className="text-center group/stat">
                                  <div className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em] mb-3 group-hover/stat:text-slate-300 transition-colors">Dilated_Time</div>
                                  <div className="text-5xl font-black text-rose-500 tracking-tighter">{(1 * gamma).toFixed(3)}<span className="text-sm text-rose-900 ml-1">s</span></div>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {/* Floating HUD Label */}
              <div className="absolute bottom-10 left-10 z-20 pointer-events-none">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[24px] bg-cyan-500 flex items-center justify-center text-black shadow-[0_0_40px_rgba(6,182,212,0.6)]">
                        {viewMode === '3d' ? <Box size={32} /> : <Layout size={32} />}
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-2">
                            {viewMode === '3d' ? 'Spatial Projection' : 'Warp Blueprint'}
                        </h2>
                        <div className="font-mono text-[10px] text-cyan-500/60 uppercase font-bold tracking-[0.5em]">Quantum_Engine_v4.0_Active</div>
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>

          {/* Controls Card - More professional layout */}
          <div className="bg-space-800/40 backdrop-blur-xl p-6 md:p-8 rounded-[40px] border border-white/10 shadow-2xl relative overflow-hidden group/controls shrink-0">
            <div className="absolute top-0 right-0 p-24 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover/controls:bg-cyan-500/10 transition-colors duration-700"></div>
            
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight uppercase">Velocity Modulation</h2>
              </div>
              <div className="flex gap-2">
                  <button onClick={() => handleVelocityChange(0)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all shadow-xl">
                      <RotateCcw size={18} />
                  </button>
              </div>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="group/slider">
                <div className="flex justify-between mb-4 items-center">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Target_Velocity (v/c)</label>
                  <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 font-mono text-cyan-400 text-xl font-black shadow-2xl tracking-tighter">
                    {velocity.toFixed(3)}<span className="text-[10px] text-cyan-900 ml-1">c</span>
                  </div>
                </div>
                <input 
                  type="range" min="0" max="0.995" step="0.001" 
                  value={velocity} 
                  onChange={(e) => { setVelocity(parseFloat(e.target.value)); trackSlider("warp-velocity", parseFloat(e.target.value)); }} 
                  className="w-full h-2 bg-space-900 rounded-full appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all border border-white/5 shadow-inner" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-black/40 p-4 rounded-[24px] border border-white/5 shadow-inner">
                    <div className="text-slate-500 text-[8px] font-black uppercase tracking-[0.3em] mb-2">Gamma (γ)</div>
                    <div className="text-2xl font-black text-white tracking-tighter">{(gamma).toFixed(3)}</div>
                 </div>
                 <div className="bg-black/40 p-4 rounded-[24px] border border-white/5 shadow-inner">
                    <div className="text-slate-500 text-[8px] font-black uppercase tracking-[0.3em] mb-2">Rest_Size</div>
                    <div className="text-2xl font-black text-rose-500 tracking-tighter">{(100/gamma).toFixed(1)}%</div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Professional Analysis Panel */}
        <div className="w-full flex flex-col gap-8">
           <div className="bg-space-800/60 backdrop-blur-xl p-8 md:p-12 rounded-[40px] border border-white/10 shadow-2xl flex flex-col lg:flex-row gap-12 relative overflow-hidden group/sidebar">
              <div className="absolute bottom-0 left-0 p-24 bg-purple-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 group-hover/sidebar:bg-purple-500/10 transition-colors duration-700"></div>
              
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-6 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30 shadow-xl">
                      <Info size={20} />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">
                      Analysis
                  </h3>
                </div>

                <div className="text-sm text-slate-400 space-y-4 mb-8 leading-relaxed relative z-10 font-medium italic">
                    <p>In this <span className="text-cyan-400 font-bold">Warp Blueprint</span>, we observe the theoretical contraction of the ship's physical bounds.</p>
                </div>

                <div className="space-y-4 relative z-10">
                  <Button onClick={handleExplain} disabled={loadingExpl} className="w-full h-14 rounded-[20px] text-sm font-black uppercase tracking-widest shadow-2xl group" variant="outline">
                      {loadingExpl ? 'Processing...' : (
                          <span className="flex items-center gap-3">
                              Ask AI Expert <Binary size={18} className="group-hover:rotate-12 transition-transform" />
                          </span>
                      )}
                  </Button>
                  
                  <AnimatePresence>
                    {explanation && (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          className="bg-cyan-500/5 p-4 rounded-[24px] border border-cyan-500/20 text-xs leading-relaxed"
                        >
                            <p className="text-cyan-100 italic font-medium">"{explanation}"</p>
                        </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex-1 pt-8 lg:pt-0 lg:pl-12 lg:border-l border-white/5">
                  <LorentzGraph currentV={velocity} />
              </div>
           </div>
        </div>
      </div>

      {/* The AR Bookmark Section - More integrated */}
      <div className="mt-20">
        <ARBookmark title="Warp Drive Interaction" simId="warp" />
      </div>

      {/* Next Step Guidance */}
      <div className="mt-32 pt-16 border-t border-white/5 flex flex-col items-center gap-8">
        <div className="text-center">
          <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tight">Experiment with Paradoxes</h3>
          <p className="text-slate-400 font-medium text-lg">Apply your knowledge to famous thought experiments like the Twin Paradox.</p>
        </div>
        <Button 
          size="lg" 
          onClick={() => setMode?.(ViewMode.EXPERIMENTS)}
          className="h-20 px-16 rounded-[24px] flex items-center gap-4 group text-xl font-black uppercase tracking-widest shadow-[0_0_50px_rgba(6,182,212,0.4)]"
        >
          Next: Thought Experiments <ArrowRight className="group-hover:translate-x-3 transition-transform" size={24} />
        </Button>
      </div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .translate-z-10 {
          transform: translateZ(60px);
        }
        @keyframes slide {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};



import React, { useState } from 'react';
import { Button } from './Button';
import { Info, TrainFront, Sparkles, Zap, ArrowRight } from 'lucide-react';
import { SpeechControl } from './SpeechControl';
import { usePageTracking, useAnalytics } from '../contexts/AnalyticsContext';
import { ARBookmark } from './ARBookmark';
import { motion, AnimatePresence } from 'motion/react';

export const ExpTrainTunnel: React.FC = () => {
  const [velocity, setVelocity] = useState(0.866);
  const [viewFrame, setViewFrame] = useState<'tunnel' | 'train'>('tunnel');

  usePageTracking("ExpTrainTunnel");
  const { trackSlider } = useAnalytics();

  const gamma = 1 / Math.sqrt(1 - velocity * velocity);

  const explanationText = viewFrame === 'tunnel' 
    ? "From the Tunnel's perspective, the moving train contracts and physically fits inside."
    : "From the Train's perspective, the tunnel contracts, so the train appears too long.";

  return (
    <div className="space-y-12 animate-in fade-in duration-700 relative">
      
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
                {velocity > 0.8 ? "Mind the Gap!" : "Steady as she goes."}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="relative group">
        {/* 3D "Shocking" Background Glow */}
        <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-500/10 via-transparent to-purple-500/10 rounded-[48px] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
        
        <div className="relative bg-space-800/40 backdrop-blur-xl p-6 md:p-8 rounded-[40px] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
               <div>
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-2">
                    <Sparkles size={10} /> Paradox_Module_02
                 </div>
                 <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                    <TrainFront className="text-cyan-500" size={28} />
                    Train-Tunnel <span className="text-purple-400">Paradox</span>
                 </h2>
               </div>
               
               <div className="flex bg-black/40 backdrop-blur-2xl rounded-xl p-1 border border-white/10 shadow-2xl">
                  <button 
                    onClick={() => setViewFrame('tunnel')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewFrame === 'tunnel' ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.5)]' : 'text-slate-400 hover:text-white'}`}
                  >
                    Tunnel Frame
                  </button>
                  <button 
                    onClick={() => setViewFrame('train')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewFrame === 'train' ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.5)]' : 'text-slate-400 hover:text-white'}`}
                  >
                    Train Frame
                  </button>
               </div>
          </div>

          <div className="flex flex-col gap-8">
            {/* 2D Schematic Viewport */}
            <motion.div 
              whileHover={{ scale: 1.005, rotateX: 1 }}
              className="perspective-1000 relative bg-black/40 rounded-[32px] overflow-hidden border border-white/5 shadow-inner flex flex-col items-center justify-center p-6 group/viewport min-h-[400px]"
            >
                 <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #1e2548 0px, #1e2548 1px, transparent 1px, transparent 10px)' }}></div>
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent"></div>
                 
                 {/* Blueprint Layout */}
                 <div className="relative z-10 w-full max-w-3xl space-y-12 transform-gpu transition-transform duration-700 group-hover/viewport:translate-z-10">
                     <div className="text-center">
                        <div className="text-[8px] text-slate-500 uppercase font-black tracking-[0.5em] mb-2">Length_Comparison_Blueprint (γ = {gamma.toFixed(3)})</div>
                     </div>

                     <div className="space-y-8">
                        {/* Tunnel Schematic */}
                        <div className="relative flex flex-col items-center">
                            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Tunnel_Section_A (Ref: {viewFrame === 'tunnel' ? 'Stationary' : "Moving"})</div>
                            <motion.div 
                                animate={{ scale: viewFrame === 'train' ? 1/gamma : 1 }}
                                className="h-12 bg-slate-800/80 border-x-4 border-slate-600 flex items-center justify-center text-[10px] font-black text-slate-400 transition-all duration-700 shadow-2xl relative overflow-hidden"
                                style={{ width: '100%' }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                                TUNNEL_BOUNDS_01
                            </motion.div>
                        </div>

                        {/* Train Schematic */}
                        <div className="relative flex flex-col items-center">
                             <div className="text-[8px] font-black text-cyan-500 uppercase tracking-widest mb-2">Relativistic_Train_ID_05</div>
                             <motion.div 
                                animate={{ scale: viewFrame === 'tunnel' ? 1/gamma : 1 }}
                                className="h-10 bg-cyan-900/40 border border-cyan-500 rounded-xl flex items-center justify-center text-[10px] font-black text-cyan-200 transition-all duration-700 shadow-[0_0_20px_rgba(6,182,212,0.3)] relative overflow-hidden"
                                style={{ width: '100%' }}
                             >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent animate-pulse"></div>
                                TRAIN_CAR_UNIT
                             </motion.div>
                        </div>
                     </div>
                 </div>

                 {/* Floating HUD Elements */}
                 <div className="absolute top-6 left-6 flex flex-col gap-3">
                    <div className="bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-xl transform -skew-x-12">
                      <div className="text-[7px] font-black text-cyan-500 uppercase tracking-widest mb-1">Lorentz_Contraction</div>
                      <div className="text-xl font-black text-white">{(100/gamma).toFixed(1)}% <span className="text-[8px] text-slate-500">Rest_L</span></div>
                    </div>
                 </div>
            </motion.div>

            <div className="w-full flex flex-col gap-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-black/20 p-8 rounded-[32px] border border-white/5">
                        <div className="flex justify-between items-center mb-6">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Velocity_Modulation</label>
                          <span className="text-cyan-400 font-black text-lg">{velocity.toFixed(3)}c</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="0.99" 
                          step="0.001" 
                          value={velocity} 
                          onChange={(e) => setVelocity(parseFloat(e.target.value))} 
                          className="w-full h-2 bg-space-600 rounded-full appearance-none cursor-pointer accent-cyan-500 shadow-inner" 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/40 p-8 rounded-[24px] border border-white/5 shadow-2xl">
                            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Gamma_Factor</div>
                            <div className="text-4xl font-black text-white tracking-tighter">{gamma.toFixed(3)}</div>
                        </div>
                        <div className="bg-black/40 p-8 rounded-[24px] border border-white/5 shadow-2xl">
                            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Simultaneity_Shift</div>
                            <div className="text-4xl font-black text-purple-400 tracking-tighter">{(velocity * gamma).toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 p-8 md:p-12 rounded-[32px] border border-white/10 flex flex-col lg:flex-row gap-12 relative overflow-hidden group/info">
                    <div className="absolute top-0 right-0 p-24 bg-cyan-500/5 rounded-full blur-3xl group-hover/info:bg-cyan-500/10 transition-colors"></div>
                    
                    <div className="relative z-10 flex-1">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-cyan-400 border border-white/10">
                          <Info size={16} />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-tight">Analysis</h3>
                      </div>
                      <p className="text-slate-400 text-lg leading-relaxed font-medium italic">
                        "{explanationText}"
                      </p>
                    </div>

                    <div className="pt-8 lg:pt-0 lg:pl-12 lg:border-l border-white/5 flex flex-col justify-center gap-6 relative z-10">
                      <div className="flex items-center gap-2 text-[10px] font-black text-cyan-500 uppercase tracking-widest">
                        Length_Contraction_Active <Zap size={10} />
                      </div>
                      <SpeechControl text={explanationText} />
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0">
        <ARBookmark title="Train-Tunnel Interaction" simId="train_tunnel" />
      </div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .translate-z-10 {
          transform: translateZ(50px);
        }
      `}</style>
    </div>
  );
};


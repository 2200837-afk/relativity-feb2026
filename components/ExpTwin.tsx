
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Play, RotateCcw, Info, Users, ArrowRight, Sparkles, Rocket } from 'lucide-react';
import { SpeechControl } from './SpeechControl';
import { usePageTracking, useAnalytics } from '../contexts/AnalyticsContext';
import { ARBookmark } from './ARBookmark';
import { motion, AnimatePresence } from 'motion/react';

export const ExpTwin: React.FC = () => {
  const [velocity, setVelocity] = useState(0.8);
  const [distance, setDistance] = useState(5); 
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  usePageTracking("ExpTwinParadox");
  const { trackSlider } = useAnalytics();

  useEffect(() => {
    let interval: any;
    if (playing) {
        interval = setInterval(() => {
            setProgress(p => {
                if (p >= 1) { setPlaying(false); return 1; }
                return p + 0.005;
            });
        }, 20);
    }
    return () => clearInterval(interval);
  }, [playing]);

  const gamma = 1 / Math.sqrt(1 - velocity * velocity);
  const totalTripTimeEarth = (distance / velocity) * 2; 
  const earthAgeVal = 20 + (progress * totalTripTimeEarth);
  const shipAgeVal = 20 + (progress * totalTripTimeEarth / gamma);

  const explanationText = "The space-time path of the traveling twin is shorter than the earthbound twin's path because of the acceleration and shift in reference frames.";

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
                {playing ? "Engaging Warp Drive!" : "Ready for Launch?"}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="relative group">
        {/* 3D "Shocking" Background Glow */}
        <div className="absolute -inset-4 bg-gradient-to-tr from-purple-500/10 via-transparent to-cyan-500/10 rounded-[48px] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
        
        <div className="relative bg-space-800/40 backdrop-blur-xl p-6 md:p-8 rounded-[40px] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
               <div>
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">
                    <Sparkles size={10} /> Paradox_Module_03
                 </div>
                 <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                    <Users className="text-purple-500" size={28} />
                    Twin <span className="text-cyan-400">Paradox</span>
                 </h2>
               </div>
               
               <div className="flex gap-3">
                  <Button 
                    onClick={() => setPlaying(!playing)} 
                    variant="primary" 
                    size="md"
                    className="h-12 px-6 rounded-xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.3)] group"
                  >
                     {playing ? <RotateCcw className="animate-spin mr-2" size={16} /> : <Play className="mr-2" size={16} />}
                     {playing ? 'In Flight' : 'Launch'}
                  </Button>
                  <Button 
                    onClick={() => { setProgress(0); setPlaying(false); }} 
                    variant="secondary" 
                    size="md"
                    className="h-12 w-12 rounded-xl flex items-center justify-center border-white/5"
                  >
                     <RotateCcw size={16} />
                  </Button>
               </div>
          </div>
          
          <div className="flex flex-col gap-8">
            {/* 3D Schematic Viewport: Minkowski Diagram Style */}
            <motion.div 
              whileHover={{ scale: 1.005, rotateX: 1 }}
              className="perspective-1000 relative bg-black/40 rounded-[32px] overflow-hidden border border-white/5 shadow-inner flex flex-col items-center justify-center p-6 group/viewport min-h-[400px]"
            >
                 <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#1e2548 1px, transparent 1px), linear-gradient(90deg, #1e2548 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent"></div>
                 
                 {/* The Diagram */}
                 <div className="relative z-10 w-full max-w-xl h-full border-l-2 border-b-2 border-white/10 p-8 flex flex-col justify-end transform-gpu transition-transform duration-700 group-hover/viewport:translate-z-10">
                    <div className="absolute -left-12 top-0 text-[8px] text-slate-500 font-black uppercase tracking-[0.5em] rotate-90 origin-left">Temporal_Axis &uarr;</div>
                    <div className="absolute -bottom-8 right-0 text-[8px] text-slate-500 font-black uppercase tracking-[0.5em]">Spatial_Distance &rarr;</div>

                    {/* Earth Worldline (Vertical) */}
                    <div className="absolute left-0 bottom-0 w-0.5 bg-blue-500/40 h-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                    
                    {/* Traveling Twin Worldline (Angle) */}
                    <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="#ec4899" />
                          </linearGradient>
                        </defs>
                        {/* Trip Out */}
                        <motion.line 
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            x1="0" y1="100" x2="80" y2="50" 
                            stroke="url(#lineGrad)" strokeWidth="0.5" strokeDasharray="2,1" 
                        />
                        {/* Trip Back */}
                        <motion.line 
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            x1="80" y1="50" x2="0" y2="0" 
                            stroke="url(#lineGrad)" strokeWidth="0.5" strokeDasharray="2,1" 
                        />
                        
                        {/* Current Position Marker */}
                        <AnimatePresence>
                          {(playing || progress > 0) && (
                              <motion.g
                                initial={{ scale: 0 }}
                                animate={{ 
                                  scale: 1,
                                  x: progress <= 0.5 ? progress * 160 : 160 - (progress * 160),
                                  y: 100 - (progress * 100)
                                }}
                              >
                                <circle r="2" fill="#06b6d4" className="shadow-[0_0_15px_rgba(6,182,212,1)]" />
                                <circle r="4" stroke="#06b6d4" strokeWidth="0.5" fill="transparent" className="animate-ping" />
                              </motion.g>
                          )}
                        </AnimatePresence>
                    </svg>

                    <div className="mt-auto text-center font-black text-[8px] text-slate-600 uppercase tracking-[0.4em]">Minkowski_Projection_v2.0</div>
                 </div>

                 {/* Floating HUD Elements */}
                 <div className="absolute top-6 left-6 flex flex-col gap-3">
                    <div className="bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-xl transform -skew-x-12">
                      <div className="text-[7px] font-black text-cyan-500 uppercase tracking-widest mb-1">Velocity_Vector</div>
                      <div className="text-xl font-black text-white">{(velocity * 100).toFixed(0)}% <span className="text-[8px] text-slate-500">c</span></div>
                    </div>
                 </div>
            </motion.div>

            <div className="w-full flex flex-col gap-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-black/20 p-8 rounded-[32px] border border-white/5">
                        <div className="flex justify-between items-center mb-6">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Warp_Factor</label>
                          <span className="text-cyan-400 font-black text-lg">{velocity.toFixed(2)}c</span>
                        </div>
                        <input 
                          type="range" 
                          min="0.1" 
                          max="0.99" 
                          step="0.01" 
                          value={velocity} 
                          onChange={(e) => setVelocity(parseFloat(e.target.value))} 
                          className="w-full h-2 bg-space-600 rounded-full appearance-none cursor-pointer accent-cyan-500 shadow-inner" 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/40 p-8 rounded-[24px] border border-white/5 shadow-2xl">
                            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Earth_Age</div>
                            <div className="text-4xl font-black text-white tracking-tighter">{earthAgeVal.toFixed(1)}<span className="text-[10px] text-slate-600 ml-1">yrs</span></div>
                        </div>
                        <div className="bg-black/40 p-8 rounded-[24px] border border-white/5 shadow-2xl">
                            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Ship_Age</div>
                            <div className="text-4xl font-black text-cyan-400 tracking-tighter">{shipAgeVal.toFixed(1)}<span className="text-[10px] text-slate-600 ml-1">yrs</span></div>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 p-8 md:p-12 rounded-[32px] border border-white/10 flex flex-col lg:flex-row gap-12 relative overflow-hidden group/info">
                    <div className="absolute top-0 right-0 p-24 bg-purple-500/5 rounded-full blur-3xl group-hover/info:bg-purple-500/10 transition-colors"></div>
                    
                    <div className="relative z-10 flex-1">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-purple-400 border border-white/10">
                          <Info size={16} />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-tight">Analysis</h3>
                      </div>
                      <p className="text-slate-400 text-lg leading-relaxed font-medium italic">
                        "{explanationText}"
                      </p>
                    </div>

                    <div className="pt-8 lg:pt-0 lg:pl-12 lg:border-l border-white/5 flex flex-col justify-center gap-6 relative z-10">
                      <div className="flex items-center gap-2 text-[10px] font-black text-purple-500 uppercase tracking-widest">
                        Frame_Symmetry_Broken <Rocket size={10} />
                      </div>
                      <SpeechControl text={explanationText} />
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0">
        <ARBookmark title="Twin Paradox Interaction" simId="twin" />
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


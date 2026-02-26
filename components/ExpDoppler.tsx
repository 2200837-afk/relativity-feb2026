
import React, { useState } from 'react';
import { Button } from './Button';
import { Info, AlertTriangle, Activity, Zap, Sparkles, ArrowRight } from 'lucide-react';
import { SpeechControl } from './SpeechControl';
import { usePageTracking, useAnalytics } from '../contexts/AnalyticsContext';
import { ARBookmark } from './ARBookmark';
import { motion, AnimatePresence } from 'motion/react';

export const ExpDoppler: React.FC = () => {
  const [velocity, setVelocity] = useState(0); 
  usePageTracking("ExpDoppler");
  const { trackSlider } = useAnalytics();

  const baseWavelength = 550;
  const calculateWavelength = (v: number) => baseWavelength * Math.sqrt((1 - v) / (1 + v));
  const observedWavelength = calculateWavelength(velocity);

  const wavelengthToColor = (wavelength: number) => {
    let r, g, b;
    if (wavelength >= 380 && wavelength < 440) { r = -(wavelength - 440) / (440 - 380); g = 0; b = 1; } 
    else if (wavelength >= 440 && wavelength < 490) { r = 0; g = (wavelength - 440) / (490 - 440); b = 1; } 
    else if (wavelength >= 490 && wavelength < 510) { r = 0; g = 1; b = -(wavelength - 510) / (510 - 490); } 
    else if (wavelength >= 510 && wavelength < 580) { r = (wavelength - 510) / (580 - 510); g = 1; b = 0; } 
    else if (wavelength >= 580 && wavelength < 645) { r = 1; g = -(wavelength - 645) / (645 - 580); b = 0; } 
    else if (wavelength >= 645 && wavelength < 781) { r = 1; g = 0; b = 0; } 
    else {
      if (wavelength < 380) return '#440088'; // UV
      if (wavelength > 781) return '#880000'; // IR
      return '#000000';
    }
    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const colorHex = wavelengthToColor(observedWavelength);
  const isInvisible = observedWavelength < 380 || observedWavelength > 780;
  
  const explanationText = Math.abs(velocity) < 0.05 
    ? "Stationary state. The spectral lines remain in their original green position."
    : velocity > 0 
        ? "Blueshift: Wavelengths are compressed. Frequency increases as you approach the source."
        : "Redshift: Wavelengths are stretched. Frequency decreases as you recede from the source.";

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-6xl mx-auto relative">
      
      {/* Navigator Cat - Pop-out Assistant */}
      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="fixed bottom-12 right-12 z-[100] hidden lg:block"
      >
        <div className="relative group">
          <div className="absolute -inset-4 bg-yellow-500/20 rounded-full blur-2xl group-hover:bg-yellow-500/40 transition-all duration-500"></div>
          <div className="relative bg-space-800/80 backdrop-blur-2xl border border-white/10 p-6 rounded-[40px] shadow-2xl flex flex-col items-center gap-4 border-b-4 border-yellow-500">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-500 to-cyan-500 p-1">
              <div className="w-full h-full rounded-full bg-space-900 flex items-center justify-center overflow-hidden">
                <img 
                  src="https://picsum.photos/seed/spacecat_doppler/200/200" 
                  alt="Navigator Cat" 
                  className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-1">Navigator_Cat</div>
              <div className="text-xs font-bold text-white max-w-[120px]">
                {velocity > 0.5 ? "Feeling blue?" : velocity < -0.5 ? "Seeing red!" : "Spectral scan clear."}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="relative group">
        {/* 3D "Shocking" Background Glow */}
        <div className="absolute -inset-4 bg-gradient-to-tr from-yellow-500/10 via-transparent to-cyan-500/10 rounded-[48px] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
        
        <div className="relative bg-space-800/40 backdrop-blur-xl p-6 md:p-8 rounded-[40px] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col">
          <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4 relative z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400 border border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                    <Zap size={24} />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[8px] font-black text-yellow-400 uppercase tracking-widest mb-1">
                    <Sparkles size={10} /> Experiment_Module_03
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Doppler <span className="text-cyan-400">Shift</span></h2>
                </div>
              </div>
              <div className="px-6 py-2 bg-black/60 backdrop-blur-2xl rounded-2xl border border-white/10 font-mono text-cyan-400 text-2xl font-black shadow-[0_0_20px_rgba(34,211,238,0.2)] transform -rotate-1">
                {velocity > 0 ? '+' : ''}{velocity.toFixed(2)}<span className="text-xs text-cyan-900 ml-1">c</span>
              </div>
          </div>

          <div className="flex flex-col gap-8">
            {/* 2D Schematic Viewport - Popping out */}
            <motion.div 
              whileHover={{ scale: 1.005, rotateX: 1 }}
              className="perspective-1000 relative bg-black/40 rounded-[32px] overflow-hidden border border-white/5 shadow-inner flex flex-col items-center justify-center p-6 group/viewport min-h-[400px]"
            >
                 <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 64px)' }}></div>
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-500/5 to-transparent"></div>
                 
                 {/* Spectral Diagram */}
                 <div className="relative z-10 w-full max-w-3xl space-y-12 transform-gpu transition-transform duration-700 group-hover/viewport:translate-z-10">
                    <div className="flex flex-col items-center">
                        <div className="px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[8px] text-cyan-400 uppercase font-black tracking-[0.5em] mb-8 shadow-2xl">
                          Waveform_Visualisation (λ = {observedWavelength.toFixed(0)}nm)
                        </div>
                        <div className="h-32 w-full flex items-center justify-center relative overflow-hidden bg-black/60 rounded-[24px] border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                            {/* Animated Wave SVG */}
                            <svg className="w-full h-full" viewBox="0 0 800 100" preserveAspectRatio="none">
                                <motion.path 
                                  animate={{ 
                                    d: `M 0 50 ${[...Array(100)].map((_, i) => {
                                        // Dynamic frequency based on wavelength
                                        // Lower wavelength = Higher frequency = More peaks
                                        const freq = 550 / observedWavelength; 
                                        const x = i * 10;
                                        const y = Math.sin(x * 0.05 * freq) * 30 + 50;
                                        return `L ${x} ${y}`;
                                    }).join(' ')}` 
                                  }}
                                  fill="none" 
                                  stroke={colorHex} 
                                  strokeWidth="4"
                                  className="transition-all duration-700"
                                  style={{ 
                                    filter: `drop-shadow(0 0 15px ${colorHex})`
                                  }}
                                />
                            </svg>
                            <AnimatePresence>
                              {isInvisible && (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-20"
                                >
                                   <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 border border-red-500/30 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                                      <AlertTriangle size={32} />
                                   </div>
                                   <div className="text-center">
                                     <div className="text-white font-black uppercase tracking-[0.6em] text-xs mb-1">Invisible_Spectrum</div>
                                     <div className="text-red-400 font-black text-xl uppercase tracking-widest">{observedWavelength < 380 ? 'Ultraviolet' : 'Infrared'}</div>
                                   </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                       <motion.div whileHover={{ y: -3 }} className="text-center group/color">
                          <div className="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em] mb-3 group-hover/color:text-slate-300 transition-colors">Color_Profile</div>
                          <div className="h-14 w-full rounded-xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.6)] transition-all duration-700 relative overflow-hidden" style={{ backgroundColor: colorHex }}>
                              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-black/20"></div>
                          </div>
                       </motion.div>
                       <motion.div whileHover={{ y: -3 }} className="text-center group/shift">
                          <div className="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em] mb-3 group-hover/shift:text-slate-300 transition-colors">Shift_Status</div>
                          <div className={`text-4xl font-black uppercase tracking-tighter transition-all duration-700 ${velocity > 0 ? 'text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]' : velocity < 0 ? 'text-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.5)]' : 'text-slate-700'}`}>
                            {velocity > 0 ? 'Blueshift' : velocity < 0 ? 'Redshift' : 'Rest'}
                          </div>
                       </motion.div>
                    </div>
                 </div>
            </motion.div>

            <div className="w-full flex flex-col gap-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-black/40 p-8 rounded-[32px] border border-white/5 shadow-inner">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-rose-500 font-black uppercase tracking-[0.3em] text-[8px]">Receding</span>
                        <span className="text-cyan-400 font-black uppercase tracking-[0.3em] text-[8px]">Approaching</span>
                      </div>
                      <input 
                        type="range" min="-0.95" max="0.95" step="0.001" 
                        value={velocity} onChange={(e) => setVelocity(parseFloat(e.target.value))}
                        className="w-full h-2 bg-space-900 rounded-full appearance-none cursor-pointer accent-white transition-all border border-white/10 shadow-2xl"
                      />
                    </div>

                    <div className="bg-black/40 p-8 rounded-[32px] border border-white/5 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="text-[8px] text-slate-500 uppercase font-black tracking-[0.3em]">Spectral_Mapping</h4>
                          <Activity size={10} className="text-cyan-500 animate-pulse" />
                        </div>
                        <div className="relative h-12 w-full rounded-xl bg-gradient-to-r from-purple-900 via-green-500 to-red-900 mb-4 overflow-hidden border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                            <div className="absolute top-0 bottom-0 w-1 bg-white/20" style={{ left: '50%' }}></div>
                            <motion.div 
                              animate={{ left: `${Math.min(100, Math.max(0, ((observedWavelength - 300) / (800 - 300)) * 100))}%` }}
                              className="absolute top-0 bottom-0 w-1.5 bg-white shadow-[0_0_20px_white] z-10"
                            ></motion.div>
                        </div>
                        <div className="flex justify-between text-[7px] text-slate-600 uppercase font-black tracking-widest">
                            <span>300nm</span>
                            <span className="text-slate-400">550nm</span>
                            <span>800nm</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-500/10 to-cyan-500/10 p-8 md:p-12 rounded-[32px] border border-white/10 flex flex-col lg:flex-row gap-12 relative overflow-hidden group/info">
                     <div className="absolute top-0 right-0 p-24 bg-yellow-500/5 rounded-full blur-3xl group-hover/info:bg-yellow-500/10 transition-colors"></div>
                     
                     <div className="relative z-10 flex-1">
                       <div className="flex items-center gap-3 mb-6">
                         <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-yellow-400 border border-white/10 shadow-xl">
                            <Info size={16} />
                         </div>
                         <h3 className="text-sm font-black text-white uppercase tracking-tight">Analysis</h3>
                       </div>
                       <p className="text-slate-400 text-lg leading-relaxed italic font-medium">
                          "{explanationText}"
                       </p>
                     </div>

                     <div className="pt-8 lg:pt-0 lg:pl-12 lg:border-l border-white/5 flex flex-col justify-center gap-6 relative z-10">
                        <div className="flex items-center justify-between w-full">
                          <SpeechControl text={explanationText} />
                          <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="flex items-center gap-2 text-[10px] font-black text-yellow-500 uppercase tracking-widest cursor-pointer"
                          >
                            Explore <ArrowRight size={10} />
                          </motion.div>
                        </div>
                     </div>
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0">
        <ARBookmark title="Spectral Doppler Interaction" simId="doppler" />
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


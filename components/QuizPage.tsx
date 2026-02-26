
import React, { useState } from 'react';
import { Button } from './Button';
import { CheckCircle, XCircle, Award, RotateCcw, HelpCircle, ArrowRight, Sparkles, Target, Activity } from 'lucide-react';
import { usePageTracking, useAnalytics } from '../contexts/AnalyticsContext';
import { db } from '../services/databaseService';
import { motion, AnimatePresence } from 'motion/react';

interface QuizPageProps {
  onComplete?: () => void;
  goToFeedback?: () => void;
}

interface Question {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "According to the Second Postulate of Special Relativity, the speed of light in a vacuum is:",
    options: [
      "Faster if the source is moving towards you",
      "Slower if the source is moving away from you",
      "Constant for all observers, regardless of motion",
      "Dependent on the gravity of nearby stars"
    ],
    correctIndex: 2,
    explanation: "The speed of light (c) is a universal constant (approx 300,000 km/s) and remains the same for all observers, no matter how fast they are moving."
  },
  {
    id: 2,
    text: "In the Twin Paradox, why does the traveling twin return younger than the earthbound twin?",
    options: [
      "Biology works differently in space",
      "The traveling twin accelerates (changes inertial frames), breaking symmetry",
      "The earthbound twin was closer to the sun's gravity",
      "Time dilation only affects mechanical clocks, not humans"
    ],
    correctIndex: 1,
    explanation: "While velocity is relative, acceleration is absolute. The traveling twin turns around to return, switching inertial frames, which distinguishes their timeline from the Earth twin."
  },
  {
    id: 3,
    text: "What happens to the length of an object as it approaches the speed of light?",
    options: [
      "It expands in all directions",
      "It contracts (shrinks) only in the direction of motion",
      "It contracts in all directions",
      "Its length remains unchanged"
    ],
    correctIndex: 1,
    explanation: "This is Length Contraction. Objects appear shorter along the axis of travel relative to a stationary observer."
  },
  {
    id: 4,
    text: "If a spaceship travels towards a star at 0.5c, what color shift will the astronaut observe?",
    options: [
      "Redshift (Lower frequency)",
      "Blueshift (Higher frequency)",
      "No shift (Green stays Green)",
      "Grayscale shift"
    ],
    correctIndex: 1,
    explanation: "Doppler Effect: Moving towards a light source compresses the waves, increasing frequency and shifting visible light towards the Blue/Violet end of the spectrum."
  },
  {
    id: 5,
    text: "In the Train-Tunnel paradox, why does the tunnel observer think the train fits inside?",
    options: [
      "The tunnel gets longer",
      "The train gets shorter due to length contraction",
      "The driver brakes just in time",
      "It's an optical illusion"
    ],
    correctIndex: 1,
    explanation: "From the tunnel's perspective (stationary), the moving train undergoes length contraction, making it physically shorter than its rest length."
  },
  {
    id: 6,
    text: "Two events happen simultaneously in a stationary frame. To a moving observer, they are:",
    options: [
      "Always simultaneous",
      "Never simultaneous",
      "Not necessarily simultaneous (Relativity of Simultaneity)",
      "Backwards in time"
    ],
    correctIndex: 2,
    explanation: "Simultaneity is relative. Observers in relative motion will disagree on the timing of events separated by space."
  },
  {
    id: 7,
    text: "As an object with mass approaches the speed of light, its relativistic mass (energy required to accelerate it):",
    options: [
      "Decreases to zero",
      "Remains constant",
      "Increases towards infinity",
      "Fluctuates randomly"
    ],
    correctIndex: 2,
    explanation: "As v approaches c, the gamma factor approaches infinity. This means it would take infinite energy to accelerate a massive object to the speed of light."
  },
  {
    id: 8,
    text: "What is the Gamma factor (γ) at 0 velocity?",
    options: [
      "0",
      "1",
      "Infinity",
      "0.5"
    ],
    correctIndex: 1,
    explanation: "At rest (v=0), gamma = 1 / sqrt(1 - 0) = 1. This means time flows normally and length is normal."
  },
  {
    id: 9,
    text: "If you could travel at 99.9% the speed of light, how would the universe look ahead of you?",
    options: [
      "Pitch black",
      "Stars would spread out evenly",
      "Stars would cluster in front of you (Aberration) and shift color",
      "Everything would look blurry"
    ],
    correctIndex: 2,
    explanation: "Relativistic Aberration causes the field of view to warp, making stars appear to bunch up in the direction of travel."
  },
  {
    id: 10,
    text: "Which equation famously relates mass and energy in relativity?",
    options: [
      "F = ma",
      "E = mc²",
      "a² + b² = c²",
      "PV = nRT"
    ],
    correctIndex: 1,
    explanation: "Einstein's E=mc² shows that mass and energy are interchangeable."
  }
];

export const QuizPage: React.FC<QuizPageProps> = ({ onComplete, goToFeedback }) => {
  usePageTracking("QuizPage");
  const { trackClick } = useAnalytics();

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const currentQuestion = QUESTIONS[currentQuestionIdx];

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setIsAnswered(true);
    const isCorrect = selectedOption === currentQuestion.correctIndex;
    if (isCorrect) {
      setScore(prev => prev + 1);
      setStreak(prev => {
        const newStreak = prev + 1;
        if (newStreak > maxStreak) setMaxStreak(newStreak);
        return newStreak;
      });
    } else {
      setStreak(0);
    }
  };

  const handleNext = async () => {
    if (currentQuestionIdx < QUESTIONS.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setQuizFinished(true);
      if (onComplete) onComplete();
      const user = db.getUser();
      if (user) {
        await db.saveQuizResult({
          userId: user.id,
          score: score,
          totalQuestions: QUESTIONS.length
        });
      }
    }
  };

  const handleRetry = () => {
    setCurrentQuestionIdx(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setQuizFinished(false);
  };

  if (quizFinished) {
    const percentage = (score / QUESTIONS.length) * 100;
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center p-4 gap-8">
        {/* Thank You Alert Block */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-green-950/20 border border-green-500/30 rounded-2xl p-6 flex items-center gap-4 shadow-lg"
        >
           <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-white shrink-0">
             <CheckCircle size={28} />
           </div>
           <div>
             <h3 className="font-bold text-white">Thank You!</h3>
             <p className="text-slate-400 text-sm">Your aptitude assessment has been successfully logged to our research database.</p>
           </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-space-800 rounded-2xl border border-space-700 p-8 text-center shadow-2xl relative overflow-hidden"
        >
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500"></div>
           <Award size={80} className="text-cyan-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
           <h2 className="text-3xl font-bold text-white mb-2">Researcher Certified!</h2>
           <p className="text-slate-400 mb-6 italic">You have successfully navigated the paradoxes of special relativity.</p>
           <div className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white mb-8">{percentage}%</div>
           <div className="text-slate-500 text-sm mb-4">Score: {score} out of {QUESTIONS.length}</div>
           <div className="text-cyan-500/60 text-xs font-bold uppercase tracking-widest mb-8">Max Streak: {maxStreak}</div>
           
           <div className="space-y-3">
              <Button onClick={goToFeedback} size="lg" className="w-full flex items-center justify-center gap-2 group">
                 Proceed to Feedback <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button onClick={handleRetry} variant="secondary" size="md" className="w-full flex items-center justify-center gap-2 opacity-50 hover:opacity-100">
                 <RotateCcw size={16} /> Re-run Examination
              </Button>
           </div>
        </motion.div>
      </div>
    );
  }

  const progressPercent = ((currentQuestionIdx + 1) / QUESTIONS.length) * 100;
  const answeredCount = currentQuestionIdx + (isAnswered ? 1 : 0);
  const accuracyPercent = answeredCount > 0 ? (score / answeredCount) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto p-4 md:py-8 lg:py-12 relative">
      {/* Navigator Cat - Pop-out Assistant */}
      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="fixed bottom-12 right-12 z-[100] hidden lg:block"
      >
        <div className="relative group">
          <div className="absolute -inset-4 bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-500/40 transition-all duration-500"></div>
          <div className="relative bg-space-800/80 backdrop-blur-2xl border border-white/10 p-6 rounded-[40px] shadow-2xl flex flex-col items-center gap-4 border-b-4 border-purple-500">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-500 p-1">
              <div className="w-full h-full rounded-full bg-space-900 flex items-center justify-center overflow-hidden">
                <img 
                  src="https://picsum.photos/seed/spacecat_quiz/200/200" 
                  alt="Navigator Cat" 
                  className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Navigator_Cat</div>
              <div className="text-xs font-bold text-white max-w-[120px]">
                {isAnswered ? (selectedOption === currentQuestion.correctIndex ? "Spot on, researcher!" : "A minor deviation.") : "Focus on the postulates."}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Redesigned Header with Instrument Cluster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12 items-center">
         <div className="lg:col-span-5">
           <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <HelpCircle size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
                  Aptitude <span className="text-cyan-400">Assessment</span>
                </h1>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Validation of relativistic conceptual mastery</p>
              </div>
           </div>
         </div>

         <div className="lg:col-span-7 flex flex-wrap justify-end gap-6">
            {/* Progress Instrument - Redesigned for "震撼" effect */}
            <motion.div 
              whileHover={{ scale: 1.05, y: -5, rotateY: 5 }}
              className="relative group perspective-1000"
            >
              <div className="absolute -inset-4 bg-cyan-500/20 rounded-[32px] blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <div className="relative flex items-center gap-5 bg-space-800/60 backdrop-blur-2xl border border-white/10 p-5 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden min-w-[180px] border-b-4 border-cyan-500/50">
                <div className="relative w-16 h-16 flex items-center justify-center transform-gpu group-hover:scale-110 transition-transform duration-500">
                  <svg className="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                    <motion.circle 
                      cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" 
                      className="text-cyan-500"
                      strokeDasharray="175.9"
                      animate={{ strokeDashoffset: 175.9 - (175.9 * progressPercent) / 100 }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-cyan-400 leading-none">Q</span>
                    <span className="text-lg font-black text-white">{currentQuestionIdx + 1}</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="text-[10px] font-black text-cyan-500/70 uppercase tracking-[0.2em] mb-1">Progress</div>
                  <div className="text-3xl font-black text-white tracking-tighter flex items-baseline">
                    {Math.round(progressPercent)}<span className="text-xs text-cyan-500/50 ml-1">%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Accuracy Instrument - Redesigned for "震撼" effect */}
            <motion.div 
              whileHover={{ scale: 1.05, y: -5, rotateY: -5 }}
              className="relative group perspective-1000"
            >
              <div className="absolute -inset-4 bg-rose-500/20 rounded-[32px] blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <div className="relative flex items-center gap-5 bg-space-800/60 backdrop-blur-2xl border border-white/10 p-5 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden min-w-[180px] border-b-4 border-rose-500/50">
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/20 to-transparent border border-rose-500/30 flex items-center justify-center text-rose-400 transform-gpu group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                  <Target size={32} className={streak > 0 ? "animate-pulse" : ""} />
                  {streak > 0 && (
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 rounded-2xl border-2 border-rose-500/50"
                    />
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="text-[10px] font-black text-rose-500/70 uppercase tracking-[0.2em] mb-1">Accuracy</div>
                  <div className="text-3xl font-black text-rose-400 tracking-tighter flex items-baseline">
                    {Math.round(accuracyPercent)}<span className="text-xs text-rose-900 ml-1">%</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Activity size={10} className="text-rose-500/50" />
                    <span className="text-[8px] font-black text-rose-500/50 uppercase tracking-widest">Precision_Scan</span>
                  </div>
                </div>
                <AnimatePresence>
                  {streak > 1 && (
                    <motion.div 
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="absolute top-0 right-0 bg-rose-500 text-black text-[10px] font-black px-3 py-1 rounded-bl-2xl uppercase tracking-tighter shadow-lg flex items-center gap-1"
                    >
                      <Sparkles size={10} /> x{streak} Streak
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Score Instrument - Compact but Professional */}
            <motion.div 
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative group"
            >
              <div className="absolute -inset-4 bg-purple-500/20 rounded-[32px] blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <div className="relative flex items-center gap-4 bg-space-800/60 backdrop-blur-2xl border border-white/10 p-5 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden min-w-[140px] border-b-4 border-purple-500/50">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-inner">
                  <Award size={24} />
                </div>
                <div className="flex flex-col">
                  <div className="text-[10px] font-black text-purple-500/70 uppercase tracking-[0.2em] mb-1">Score</div>
                  <div className="text-2xl font-black text-purple-400 tracking-tighter">
                    {score}<span className="text-[10px] text-purple-900 ml-1">pts</span>
                  </div>
                </div>
              </div>
            </motion.div>
         </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentQuestionIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-space-800 rounded-[40px] border border-white/10 p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] relative overflow-hidden backdrop-blur-xl"
        >
           <div className="absolute top-0 right-0 p-48 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>
           
           <div className="relative z-10">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">
                <Sparkles size={12} className="text-cyan-400" /> Paradox Module 0{currentQuestionIdx + 1}
             </div>
             
             <h2 className="text-3xl font-black text-white mb-12 leading-[1.1] tracking-tight">
               {currentQuestion.text}
             </h2>
             
             <div className="grid grid-cols-1 gap-4">
                {currentQuestion.options.map((option, idx) => {
                   const isCorrect = idx === currentQuestion.correctIndex;
                   const isSelected = idx === selectedOption;
                   
                   let buttonClass = "w-full text-left p-6 rounded-[24px] border-2 transition-all duration-500 flex items-center justify-between group relative overflow-hidden ";
                   if (!isAnswered) {
                     buttonClass += isSelected 
                        ? "bg-cyan-500/10 border-cyan-500 text-white shadow-[0_0_30px_rgba(6,182,212,0.2)]" 
                        : "bg-black/20 border-white/5 text-slate-400 hover:border-white/20 hover:text-white hover:bg-white/5";
                   } else {
                     if (isCorrect) buttonClass += "bg-green-500/10 border-green-500 text-white shadow-[0_0_30px_rgba(34,197,94,0.2)]";
                     else if (isSelected) buttonClass += "bg-rose-500/10 border-rose-500 text-white shadow-[0_0_30px_rgba(244,63,94,0.2)]";
                     else buttonClass += "bg-black/10 border-white/5 text-slate-600 opacity-40";
                   }

                   return (
                     <motion.button
                       key={idx}
                       whileHover={!isAnswered ? { scale: 1.02, x: 10 } : {}}
                       whileTap={!isAnswered ? { scale: 0.98 } : {}}
                       onClick={() => handleSelect(idx)}
                       disabled={isAnswered}
                       className={buttonClass}
                     >
                        <span className="flex-1 pr-4 font-bold text-lg">{option}</span>
                        <AnimatePresence>
                          {isAnswered && isCorrect && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-green-500 shrink-0">
                              <CheckCircle size={24} />
                            </motion.div>
                          )}
                          {isAnswered && isSelected && !isCorrect && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-rose-500 shrink-0">
                              <XCircle size={24} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                     </motion.button>
                   );
                })}
             </div>

             {isAnswered ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-12 pt-10 border-t border-white/5"
                >
                    <div className="flex items-start gap-6 mb-10 bg-black/40 p-8 rounded-[32px] border border-white/5 shadow-inner relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-16 bg-cyan-500/5 rounded-full blur-2xl"></div>
                      <div className={`p-4 rounded-2xl shrink-0 ${selectedOption === currentQuestion.correctIndex ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                        <HelpCircle size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-white text-xs uppercase tracking-[0.2em] mb-3">Scientific Insight</h4>
                        <p className="text-slate-400 text-lg leading-relaxed font-medium">{currentQuestion.explanation}</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleNext} className="h-16 px-12 rounded-2xl text-lg font-black uppercase tracking-widest shadow-2xl group">
                        {currentQuestionIdx === QUESTIONS.length - 1 ? 'Final Analysis' : 'Next Paradox'} <ArrowRight className="group-hover:translate-x-2 transition-transform ml-2" />
                      </Button>
                    </div>
                </motion.div>
             ) : (
                <div className="mt-12 flex justify-end">
                  <Button 
                    onClick={handleSubmit} 
                    disabled={selectedOption === null}
                    className="h-16 px-16 rounded-2xl text-lg font-black uppercase tracking-widest shadow-[0_0_40px_rgba(6,182,212,0.3)] disabled:opacity-30"
                  >
                    Submit Vector
                  </Button>
                </div>
             )}
           </div>
        </motion.div>
      </AnimatePresence>

      {/* Global Progress Bar */}
      <div className="mt-16 w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${((currentQuestionIdx + (isAnswered ? 1 : 0)) / QUESTIONS.length) * 100}%` }}
          className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 shadow-[0_0_20px_rgba(6,182,212,0.5)]"
          transition={{ duration: 1, ease: "circOut" }}
        />
      </div>
    </div>
  );
};


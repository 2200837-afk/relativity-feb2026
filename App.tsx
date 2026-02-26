
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Simulation } from './components/Simulation';
import { Theory } from './components/Theory';
import { ExperimentsView } from './components/ExperimentsView';
import { Home } from './components/Home';
import { LoginPage } from './components/LoginPage';
import { QuestionnairePage } from './components/QuestionnairePage';
import { QuizPage } from './components/QuizPage';
import { ResearchPage } from './components/ResearchPage';
import { FeedbackPage } from './components/FeedbackPage';
import { ViewMode } from './types';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { db } from './services/databaseService';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { AlertCircle, ArrowRight, X } from 'lucide-react';
import { Button } from './components/Button';
import { ExpDoppler3D } from './3D_components/ExpDoppler3D';
import { ExpSimultaneity3D } from './3D_components/ExpSimultaneity3D';
import { ExpTrainTunnel3D } from './3D_components/ExpTrainTunnel3D';
import { ExpTwin3D } from './3D_components/ExpTwin3D';
import { Simulation3D } from './3D_components/Simulation3D';

const AppContent: React.FC = () => {
  const [currentMode, setMode] = useState<ViewMode>(ViewMode.HOME);
  const [velocity, setVelocity] = useState(0); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasStyle, setHasStyle] = useState(false);
  
  // Track completion of research tasks
  const [isQuizDone, setIsQuizDone] = useState(false);
  const [isFeedbackDone, setIsFeedbackDone] = useState(false);
  const [showExitReminder, setShowExitReminder] = useState(false);

  useEffect(() => {
    const user = db.getUser();
    if (user) {
      setIsLoggedIn(true);
      if (user.learningStyle) {
        setHasStyle(true);
      }
    }

    // Tab close warning
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isLoggedIn && (!isQuizDone || !isFeedbackDone)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isLoggedIn, isQuizDone, isFeedbackDone]);

  const handleLogin = () => {
    setIsLoggedIn(true);
    const user = db.getUser();
    if (user?.learningStyle) {
      setHasStyle(true);
    }
  };

  const handleQuestionnaireComplete = () => {
    setHasStyle(true);
  };

  const attemptExit = () => {
    if (!isQuizDone || !isFeedbackDone) {
      setShowExitReminder(true);
    } else {
      setMode(ViewMode.HOME);
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLogin} />;
  }

  if (!hasStyle) {
    return <QuestionnairePage onComplete={handleQuestionnaireComplete} />;
  }

  const renderContent = () => {
    // Scroll to top whenever content changes
    useEffect(() => {
      window.scrollTo(0, 0);
    }, [currentMode]);

    switch (currentMode) {
      case ViewMode.HOME:
        return <Home setMode={setMode} />;
      case ViewMode.SIMULATION:
        return <Simulation velocity={velocity} setVelocity={setVelocity} setMode={setMode} />;
      case ViewMode.EXPERIMENTS:
        return <ExperimentsView setMode={setMode} />;
      case ViewMode.THEORY:
        return <Theory setMode={setMode} />;
      case ViewMode.QUIZ:
        return <QuizPage onComplete={() => setIsQuizDone(true)} goToFeedback={() => setMode(ViewMode.FEEDBACK)} />;
      case ViewMode.RESEARCH:
        return <ResearchPage setMode={setMode} />;
      case ViewMode.FEEDBACK:
        return <FeedbackPage onComplete={() => setIsFeedbackDone(true)} goToQuiz={() => setMode(ViewMode.QUIZ)} setMode={setMode} />;
      default:
        return <Home setMode={setMode} />;
    }
  };

  return (
      <div className="min-h-screen bg-space-900 text-slate-100 font-sans selection:bg-cyan-500/30 flex flex-col">
        <Navbar currentMode={currentMode} setMode={setMode} onExit={attemptExit} />
        
        <main className="flex-1 py-8 animate-in fade-in duration-300">
          {renderContent()}
        </main>

        <footer className="border-t border-space-800 py-8">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-600 text-sm">
            <p>Relativity In Motion • Improved with React & Gemini</p>
            <div className="flex gap-6">
               <div className={`flex items-center gap-2 ${isQuizDone ? 'text-green-500' : 'text-slate-500'}`}>
                  <div className={`w-2 h-2 rounded-full ${isQuizDone ? 'bg-green-500' : 'bg-slate-700'}`}></div>
                  Quiz Status: {isQuizDone ? 'Complete' : 'Pending'}
               </div>
               <div className={`flex items-center gap-2 ${isFeedbackDone ? 'text-green-500' : 'text-slate-500'}`}>
                  <div className={`w-2 h-2 rounded-full ${isFeedbackDone ? 'bg-green-500' : 'bg-slate-700'}`}></div>
                  Feedback Status: {isFeedbackDone ? 'Complete' : 'Pending'}
               </div>
            </div>
          </div>
        </footer>

        {/* Exit Reminder Modal */}
        {showExitReminder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-space-800 border border-red-500/30 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
              <button 
                onClick={() => setShowExitReminder(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white"
              >
                <X size={24} />
              </button>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500">
                  <AlertCircle size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Hold on!</h2>
                  <p className="text-slate-400 text-sm">Your session isn't quite finished yet.</p>
                </div>
              </div>

              <p className="text-slate-300 mb-8 leading-relaxed">
                To help our research into relativistic visualization, please ensure you complete both the <span className="text-cyan-400 font-bold">Aptitude Assessment (Quiz)</span> and the <span className="text-purple-400 font-bold">Feedback Survey</span> before exiting.
              </p>

              <div className="grid grid-cols-1 gap-3 mb-8">
                {!isQuizDone && (
                  <Button 
                    variant="outline" 
                    className="w-full py-4 justify-between border-cyan-500/50 text-cyan-400"
                    onClick={() => { setMode(ViewMode.QUIZ); setShowExitReminder(false); }}
                  >
                    Complete Quiz <ArrowRight size={18} />
                  </Button>
                )}
                {!isFeedbackDone && (
                  <Button 
                    variant="outline" 
                    className="w-full py-4 justify-between border-purple-500/50 text-purple-400"
                    onClick={() => { setMode(ViewMode.FEEDBACK); setShowExitReminder(false); }}
                  >
                    Complete Feedback <ArrowRight size={18} />
                  </Button>
                )}
              </div>

              <div className="flex gap-4">
                <Button 
                  variant="secondary" 
                  className="flex-1 text-xs" 
                  onClick={() => { setMode(ViewMode.HOME); setShowExitReminder(false); }}
                >
                  Exit Anyway
                </Button>
                <Button 
                  variant="primary" 
                  className="flex-1" 
                  onClick={() => setShowExitReminder(false)}
                >
                  Stay & Finish
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
       <ScrollToTop />
       <AnalyticsProvider>
          <Routes>
            <Route path="/" element={<AppContent />} />
            <Route path="/ar/doppler" element={<ExpDoppler3D startInAR={true} />} />
            <Route path="/ar/simultaneity" element={<ExpSimultaneity3D startInAR={true} />} />
            <Route path="/ar/train_tunnel" element={<ExpTrainTunnel3D startInAR={true} />} />
            <Route path="/ar/twin" element={<ExpTwin3D startInAR={true} />} />
            <Route path="/ar/warp" element={<Simulation3D startInAR={true} />} />
          </Routes>
       </AnalyticsProvider>
    </HashRouter>
  );
};

export default App;
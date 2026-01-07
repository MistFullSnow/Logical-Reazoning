import React, { useState, useEffect } from 'react';
import { SYLLABUS, RANK_TILES, GOOGLE_SCRIPT_URL } from './constants';
import { generateQuestion } from './services/geminiService';
import { saveUserProgress, loadUserProgress } from './services/sheetService';
import { Question, Mode, TopicDef, UserStats, TopicStat } from './types';
import { CosmicButton, StarBackground, Card, Badge } from './components/CosmicComponents';

// Icons
const BackIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const BrainIcon = ({ className = "w-6 h-6" }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
const PenIcon = ({ className = "w-6 h-6" }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
const SyncIcon = ({ className = "" }: { className?: string }) => <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;

enum Screen {
  LOGIN,
  HOME,
  MODE_SELECT,
  TOPIC_SELECT,
  QUIZ,
  SUMMARY
}

const QUIZ_LENGTH = 5;

const App: React.FC = () => {
  // Navigation & Data State
  const [screen, setScreen] = useState<Screen>(Screen.LOGIN);
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<TopicDef | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [scriptUrl, setScriptUrl] = useState<string>(GOOGLE_SCRIPT_URL);
  const [isSyncing, setIsSyncing] = useState(false);

  // Quiz State
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizResults, setQuizResults] = useState<boolean[]>([]);
  
  // Stats State
  const [stats, setStats] = useState<UserStats>({});
  const [totalCorrect, setTotalCorrect] = useState(0);

  useEffect(() => {
    // Check for cached session
    const savedEmail = localStorage.getItem('cosmicEmail');
    const savedStats = localStorage.getItem('cosmicStats');
    // Ensure URL is set from constants
    setScriptUrl(GOOGLE_SCRIPT_URL);

    if (savedEmail && savedStats) {
      setUserEmail(savedEmail);
      const parsedStats = JSON.parse(savedStats);
      setStats(parsedStats);
      recalculateTotalCorrect(parsedStats);
      setScreen(Screen.HOME);
    }
  }, []);

  const recalculateTotalCorrect = (data: UserStats) => {
    let total = 0;
    Object.keys(data).forEach(key => {
      if (key !== 'email' && key !== 'totalXp') {
        total += (data[key] as TopicStat).correct;
      }
    });
    setTotalCorrect(total);
  };

  const handleLogin = async () => {
    if (!userEmail) return;
    setIsSyncing(true);
    
    // Save locally
    localStorage.setItem('cosmicEmail', userEmail);

    // Try load from sheet
    if (scriptUrl) {
      const remoteStats = await loadUserProgress(scriptUrl, userEmail);
      if (remoteStats) {
        setStats(remoteStats);
        localStorage.setItem('cosmicStats', JSON.stringify(remoteStats));
        recalculateTotalCorrect(remoteStats);
      }
    }
    
    setIsSyncing(false);
    setScreen(Screen.HOME);
  };

  const syncToCloud = async (newStats: UserStats) => {
    if (scriptUrl && userEmail) {
      setIsSyncing(true);
      await saveUserProgress(scriptUrl, userEmail, newStats);
      setIsSyncing(false);
    }
  };

  const updateStats = (isCorrect: boolean) => {
    if (!selectedTopic) return;
    
    const currentStat = (stats[selectedTopic.id] as TopicStat) || { correct: 0, total: 0, streak: 0 };
    const newStat: TopicStat = {
      correct: currentStat.correct + (isCorrect ? 1 : 0),
      total: currentStat.total + 1,
      streak: isCorrect ? currentStat.streak + 1 : 0
    };
    
    const newStats = { 
      ...stats, 
      [selectedTopic.id]: newStat,
      email: userEmail 
    };
    
    setStats(newStats);
    setTotalCorrect(prev => prev + (isCorrect ? 1 : 0));
    localStorage.setItem('cosmicStats', JSON.stringify(newStats));
    
    // Auto-sync after every answer (or you could do it at end of quiz)
    syncToCloud(newStats);
  };

  const getRank = () => {
    return RANK_TILES.slice().reverse().find(r => totalCorrect >= r.threshold) || RANK_TILES[0];
  };

  // --- Quiz Flow ---

  const startQuiz = (topic: TopicDef) => {
    setSelectedTopic(topic);
    setCurrentQuestionIndex(0);
    setQuizResults([]);
    setScreen(Screen.QUIZ);
    fetchNextQuestion(topic);
  };

  const fetchNextQuestion = async (topic: TopicDef = selectedTopic!) => {
    setLoading(true);
    setQuestion(null);
    setSelectedOption(null);
    setShowExplanation(false);
    
    const q = await generateQuestion(topic);
    setQuestion(q);
    setLoading(false);
  };

  const handleOptionSelect = (index: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(index);
    
    const isCorrect = index === question?.correctAnswerIndex;
    setQuizResults([...quizResults, isCorrect]);
    updateStats(isCorrect);
    setShowExplanation(true);
  };

  const handleNextAction = () => {
    if (currentQuestionIndex < QUIZ_LENGTH - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      fetchNextQuestion();
    } else {
      setScreen(Screen.SUMMARY);
    }
  };

  // --- Renderers ---

  const renderLogin = () => (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 animate-fade-in-up">
      <Card className="w-full max-w-md border-t-4 border-t-cosmic-glow">
        <h1 className="text-3xl font-black text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          IDENTIFY YOURSELF
        </h1>
        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">Cosmic ID (Email)</label>
            <input 
              type="email" 
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="w-full bg-cosmic-900 border border-cosmic-700 rounded-lg p-3 text-white focus:border-cosmic-accent focus:outline-none"
              placeholder="cadet@spaceforce.com"
            />
          </div>
          
          <CosmicButton onClick={handleLogin} disabled={!userEmail || isSyncing} className="w-full mt-4">
            {isSyncing ? "Establishing Link..." : "Initialize Session"}
          </CosmicButton>
        </div>
      </Card>
    </div>
  );

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center min-h-[80dvh] gap-8 p-4 text-center">
      <div className="relative">
        <div className="absolute -inset-4 bg-cosmic-glow rounded-full blur-xl opacity-30 animate-pulse"></div>
        <h1 className="relative text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 drop-shadow-sm tracking-tight">
          COSMIC LOGIC
        </h1>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm uppercase tracking-widest text-cosmic-accent">Current Rank</span>
        <span className={`text-2xl font-bold ${getRank().color}`}>{getRank().name}</span>
        <div className="flex items-center gap-2 mt-2">
          <Badge text={`Total Correct: ${totalCorrect}`} />
          {isSyncing && <SyncIcon className="animate-spin text-slate-500"/>}
        </div>
        <p className="text-xs text-slate-500 mt-1">{userEmail}</p>
      </div>

      <CosmicButton onClick={() => setScreen(Screen.MODE_SELECT)} className="w-full max-w-xs text-lg">
        Enter the Void
      </CosmicButton>
      
      <button onClick={() => setScreen(Screen.LOGIN)} className="text-xs text-slate-600 hover:text-white mt-8">
        Switch Identity
      </button>
    </div>
  );

  const renderModeSelect = () => (
    <div className="flex flex-col items-center gap-8 p-4 min-h-[80dvh] justify-center">
      <h2 className="text-3xl font-bold text-white mb-4">Select Protocol</h2>
      
      <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl">
        <button 
          onClick={() => { setSelectedMode(Mode.HANDY); setScreen(Screen.TOPIC_SELECT); }}
          className="group relative bg-cosmic-800 border border-cosmic-700 hover:border-blue-500 p-8 rounded-2xl transition-all duration-300 hover:-translate-y-2"
        >
          <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-cosmic-900 rounded-full text-blue-400">
              <BrainIcon />
            </div>
            <h3 className="text-2xl font-bold text-blue-200">Handy Mode</h3>
            <p className="text-center text-slate-400">Mental math & quick logic. No pen required.</p>
          </div>
        </button>

        <button 
          onClick={() => { setSelectedMode(Mode.PEN_PAPER); setScreen(Screen.TOPIC_SELECT); }}
          className="group relative bg-cosmic-800 border border-cosmic-700 hover:border-purple-500 p-8 rounded-2xl transition-all duration-300 hover:-translate-y-2"
        >
          <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-cosmic-900 rounded-full text-purple-400">
              <PenIcon />
            </div>
            <h3 className="text-2xl font-bold text-purple-200">Pen & Paper</h3>
            <p className="text-center text-slate-400">Complex puzzles. Scratchpad required.</p>
          </div>
        </button>
      </div>

      <CosmicButton onClick={() => setScreen(Screen.HOME)} variant="secondary" className="mt-8">
        Abort
      </CosmicButton>
    </div>
  );

  const renderTopicSelect = () => {
    const filteredTopics = SYLLABUS.filter(t => t.mode === selectedMode);

    return (
      <div className="flex flex-col p-4 w-full max-w-3xl mx-auto pt-20 pb-20">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setScreen(Screen.MODE_SELECT)} className="p-2 hover:bg-white/10 rounded-full">
            <BackIcon />
          </button>
          <h2 className="text-2xl font-bold text-white">
            {selectedMode === Mode.HANDY ? "Quick Drills" : "Deep Space Puzzles"}
          </h2>
        </div>

        <div className="grid gap-4">
          {filteredTopics.map(topic => {
            const topicStat = (stats[topic.id] as TopicStat) || { correct: 0, total: 0 };
            const accuracy = topicStat.total > 0 ? Math.round((topicStat.correct / topicStat.total) * 100) : 0;
            
            return (
              <div 
                key={topic.id}
                onClick={() => startQuiz(topic)}
                className="bg-cosmic-800/50 border border-white/5 hover:bg-cosmic-800 hover:border-cosmic-accent/50 p-4 rounded-xl cursor-pointer transition-all flex justify-between items-center group"
              >
                <div>
                  <h4 className="font-bold text-lg text-slate-200 group-hover:text-cosmic-accent transition-colors">{topic.name}</h4>
                  <p className="text-sm text-slate-500">{topic.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge 
                    text={`${accuracy}% Acc`} 
                    color={accuracy > 80 ? 'bg-green-600' : accuracy > 50 ? 'bg-yellow-600' : 'bg-slate-700'} 
                  />
                  <span className="text-xs text-slate-600">{topicStat.correct}/{topicStat.total}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderQuiz = () => (
    <div className="flex flex-col items-center w-full min-h-[100dvh]">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 w-full bg-cosmic-900/90 backdrop-blur-md border-b border-white/5 shadow-2xl">
        <div className="max-w-2xl mx-auto p-4 flex justify-between items-center">
          <button onClick={() => setScreen(Screen.TOPIC_SELECT)} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm">
            <BackIcon /> <span className="hidden sm:inline">Exit Sector</span>
          </button>
          
          <div className="flex items-center gap-4">
            <div className="text-xs font-mono text-cosmic-accent uppercase tracking-wider">
              {selectedTopic?.name}
            </div>
            <div className="flex items-center bg-cosmic-800 rounded-full px-3 py-1 border border-cosmic-700">
               <span className="text-sm font-bold text-white">{currentQuestionIndex + 1}</span>
               <span className="text-xs text-slate-500 mx-1">/</span>
               <span className="text-xs text-slate-500">{QUIZ_LENGTH}</span>
            </div>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full h-1 bg-cosmic-800">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out" 
            style={{ width: `${((currentQuestionIndex) / QUIZ_LENGTH) * 100}%` }}
          />
        </div>
      </div>

      <div className="w-full max-w-2xl p-4 pb-20 mt-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 animate-pulse">
            <div className="w-16 h-16 border-4 border-cosmic-glow border-t-transparent rounded-full animate-spin"></div>
            <p className="text-cosmic-accent">Consulting the Oracle...</p>
          </div>
        )}

        {!loading && question && (
          <div className="w-full animate-float">
            <Card className="mb-6 border-t-4 border-t-cosmic-accent">
              <div className="mb-4">
                <h3 className="text-xl md:text-2xl font-medium leading-relaxed text-white">
                  {question.text}
                </h3>
              </div>
              
              {question.svg && (
                <div className="mb-6 p-4 bg-white/5 rounded-lg flex justify-center">
                  <div dangerouslySetInnerHTML={{ __html: question.svg }} className="w-full max-w-[300px] text-white fill-current stroke-current" />
                </div>
              )}

              <div className="flex flex-col gap-3">
                {question.options.map((opt, idx) => {
                  let btnStyle = "bg-cosmic-900 border-cosmic-700 hover:bg-cosmic-700";
                  if (selectedOption !== null) {
                    if (idx === question.correctAnswerIndex) btnStyle = "bg-green-900/40 border-green-500 text-green-100";
                    else if (idx === selectedOption) btnStyle = "bg-red-900/40 border-red-500 text-red-100";
                    else btnStyle = "bg-cosmic-900 border-cosmic-700 opacity-50";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(idx)}
                      disabled={selectedOption !== null}
                      className={`p-4 rounded-lg border text-left transition-all ${btnStyle}`}
                    >
                      <span className="font-mono text-xs mr-3 opacity-50">[{String.fromCharCode(65 + idx)}]</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </Card>

            {showExplanation && (
              <div className="animate-fade-in-up">
                <Card className="mb-6 bg-green-900/10 border-green-800">
                  <h4 className="text-green-400 font-bold mb-2 uppercase text-xs tracking-wider">Analysis</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">{question.explanation}</p>
                </Card>
                
                <CosmicButton onClick={handleNextAction} className="w-full">
                  {currentQuestionIndex === QUIZ_LENGTH - 1 ? "Complete Mission" : "Next Anomaly"}
                </CosmicButton>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderSummary = () => {
    const score = quizResults.filter(Boolean).length;
    const percentage = (score / QUIZ_LENGTH) * 100;
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 animate-fade-in-up">
        <Card className="w-full max-w-md text-center border-t-4 border-t-yellow-400">
          <h2 className="text-2xl font-bold text-white mb-2">MISSION DEBRIEF</h2>
          <p className="text-slate-400 mb-6">{selectedTopic?.name}</p>
          
          <div className="mb-8">
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-red-500">
              {score}/{QUIZ_LENGTH}
            </div>
            <p className="text-sm font-mono text-slate-500 mt-2">ACCURACY: {percentage}%</p>
          </div>

          <div className="grid grid-cols-5 gap-2 mb-8">
            {quizResults.map((res, i) => (
              <div key={i} className={`h-2 rounded-full ${res ? 'bg-green-500' : 'bg-red-500'}`} />
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <CosmicButton onClick={() => startQuiz(selectedTopic!)} variant="secondary">
              Retry Mission
            </CosmicButton>
            <CosmicButton onClick={() => setScreen(Screen.TOPIC_SELECT)}>
              Return to Sector
            </CosmicButton>
          </div>
          
          {isSyncing && <p className="text-xs text-slate-500 mt-4 animate-pulse">Syncing Mission Data...</p>}
        </Card>
      </div>
    );
  };

  return (
    <div className="relative min-h-[100dvh] text-slate-200 font-sans selection:bg-cosmic-accent selection:text-white">
      <StarBackground />
      <div className="relative z-10">
        {screen === Screen.LOGIN && renderLogin()}
        {screen === Screen.HOME && renderHome()}
        {screen === Screen.MODE_SELECT && renderModeSelect()}
        {screen === Screen.TOPIC_SELECT && renderTopicSelect()}
        {screen === Screen.QUIZ && renderQuiz()}
        {screen === Screen.SUMMARY && renderSummary()}
      </div>
    </div>
  );
};

export default App;
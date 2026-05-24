import React, { useState } from 'react';
import { 
  ChevronLeft, 
  Trophy, 
  BookOpen, 
  Calendar, 
  FileText, 
  Brain,
  TrendingUp,
  Clock,
  Users,
  Award,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { extractPaperId } from '~/utils/paperId';
import { Pressable } from '~/components/ui/Pressable';

// Types
type Level = 'olevel' | 'alevel' | null;
type Mode = 'learning' | 'competition' | null;
type Subject = string;

interface PracticeConfig {
  level: Level;
  mode: Mode;
  subject: Subject | null;
  year: number | null;
  paper: string | null;
}

// Cameroon GCE Subjects Data
const SUBJECTS = {
  olevel: [
    'Mathematics',
    'English Language',
    'French',
    'Biology',
    'Physics',
    'Chemistry',
    'Geography',
    'History',
    'Economics',
    'Computer Science',
    'Literature in English',
    'Religious Education'
  ],
  alevel: [
    'Mathematics',
    'Further Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English Literature',
    'French',
    'Geography',
    'History',
    'Economics',
    'Accounting',
    'Business Studies',
    'Computer Science',
    'Geology'
  ]
};

const YEARS = Array.from({ length: 15 }, (_, i) => 2024 - i);

const PAPERS = {
  olevel: ['Paper 1 (MCQ)', /*'Paper 2 (Theory)', 'Paper 3 (Practical)'*/],
  alevel: ['Paper 1 (MCQ)', /*'Paper 2 (Structured)', 'Paper 3 (Practical)', 'Paper 4 (Essay)'*/]
};

export const PracticePage: React.FC = () => {

  const navigate = useNavigate()

  const [config, setConfig] = useState<PracticeConfig>({
    level: null,
    mode: null,
    subject: null,
    year: null,
    paper: null
  });

  const [currentStep, setCurrentStep] = useState(1);

  const totalSteps = 5;

  const updateConfig = (key: keyof PracticeConfig, value: any) => {
    
    setConfig(prev => ({ ...prev, [key]:  value }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return config.level !== null;
      case 2: return config.mode !== null;
      case 3: return config.subject !== null;
      case 4: return config.year !== null;
      case 5: return config.paper !== null;
      default: return false;
    }
  };

  const startPractice = () => {
    // Navigate to practice session
    navigate(`/practice/${config.level}-${config.subject?.toLocaleLowerCase()}-${config.year}-${extractPaperId(config.paper as string)}`);
  };

  // Step 1: Level Selection
  const renderLevelSelection = () => (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Select Your Level</h1>
        <p className="text-slate-600">Choose your examination category</p>
      </div>

      <div className="grid gap-4">
        <button
          onClick={() => updateConfig('level', 'olevel')}
          className={`relative p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
            config.level === 'olevel'
              ? 'border-purple-600 bg-purple-50 shadow-md'
              : 'border-slate-200 bg-white hover:border-purple-300'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${
              config.level === 'olevel' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              <BookOpen size={28} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-slate-900">GCE Ordinary Level</h3>
              <p className="text-sm text-slate-600">Form 3, 4 & 5</p>
            </div>
            {config.level === 'olevel' && (
              <CheckCircle2 className="text-purple-600" size={24} />
            )}
          </div>
        </button>

        <button
          onClick={() => updateConfig('level', 'alevel')}
          className={`relative p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
            config.level === 'alevel'
              ? 'border-purple-600 bg-purple-50 shadow-md'
              : 'border-slate-200 bg-white hover:border-purple-300'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${
              config.level === 'alevel' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              <Trophy size={28} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-slate-900">GCE Advanced Level</h3>
              <p className="text-sm text-slate-600">Lower 6th & Upper 6th</p>
            </div>
            {config.level === 'alevel' && (
              <CheckCircle2 className="text-purple-600" size={24} />
            )}
          </div>
        </button>
      </div>
    </div>
  );

  // Step 2: Mode Selection
  const renderModeSelection = () => (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Choose Practice Mode</h1>
        <p className="text-slate-600">How would you like to practice?</p>
      </div>

      <div className="grid gap-4">
        {/* Learning Mode */}
        <button
          onClick={() => updateConfig('mode', 'learning')}
          className={`relative p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
            config.mode === 'learning'
              ? 'border-purple-600 bg-purple-50 shadow-md'
              : 'border-slate-200 bg-white hover:border-purple-300'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${
              config.mode === 'learning' ? 'bg-purple-600 text-white' : 'bg-blue-100 text-blue-600'
            }`}>
              <BookOpen size={28} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg text-slate-900">Learning Mode</h3>
                {config.mode === 'learning' && <CheckCircle2 className="text-purple-600" size={20} />}
              </div>
              <p className="text-sm text-slate-600 mb-3">
                Practice with past GCE questions organized by year and paper type
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar size={14} /> Past Papers
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} /> Self-paced
                </span>
              </div>
            </div>
          </div>
        </button>

        {/* Competition Mode */}
        <button
        disabled
          onClick={() => updateConfig('mode', 'competition')}
          className={`relative p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
            config.mode === 'competition'
              ? 'border-purple-600 bg-purple-50 shadow-md'
              : 'border-slate-200 bg-white hover:border-purple-300'
          }`}
        >
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-linear-to-r from-amber-400 to-orange-500 text-white text-xs font-bold">
              <Sparkles size={12} />
              AI Powered
            </span>
          </div>
          
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${
              config.mode === 'competition' ? 'bg-purple-600 text-white' : 'bg-amber-100 text-amber-600'
            }`}>
              <Trophy size={28} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg text-slate-900">Competition Mode</h3>
                {config.mode === 'competition' && <CheckCircle2 className="text-purple-600" size={20} />}
              </div>
              <p className="text-sm text-slate-600 mb-3">
                Weekly AI-generated challenges based on GCE exam patterns
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <TrendingUp size={14} className="text-green-600" />
                  <span>Compete with peers nationwide</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Award size={14} className="text-purple-600" />
                  <span>Win badges & climb leaderboard</span>
                </div>
              </div>
            </div>
          </div>
        </button>
      </div>

      {config.mode === 'competition' && (
        <div className="mt-6 p-4 bg-linear-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <Clock size={20} className="text-purple-600" />
            <span className="font-semibold text-slate-900">This Week's Challenge</span>
          </div>
          <p className="text-sm text-slate-600">
            "Advanced Calculus & Mechanics" - 50 questions, 90 minutes
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <Users size={14} className="text-slate-500" />
            <span className="text-slate-600">2,847 students participating</span>
          </div>
        </div>
      )}
    </div>
  );

  // Step 3: Subject Selection
  const renderSubjectSelection = () => {
    const subjects = config.level === 'olevel' ? SUBJECTS.olevel : SUBJECTS.alevel;
    
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Select Subject</h1>
          <p className="text-slate-600">
            {config.level === 'olevel' ? 'O-Level' : 'A-Level'} Subjects
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {subjects.map((subject) => (
            <button
              key={subject}
              onClick={() => updateConfig('subject', subject)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                config.subject === subject
                  ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-md'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-purple-300'
              }`}
            >
              <span className="font-semibold text-sm">{subject}</span>
              {config.subject === subject && (
                <CheckCircle2 className="mx-auto mt-2 text-purple-600" size={20} />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Step 4: Year Selection
  const renderYearSelection = () => (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Select Year</h1>
        <p className="text-slate-600">Choose examination year</p>
      </div>

      <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
        {YEARS.map((year) => (
          <button
            key={year}
            onClick={() => updateConfig('year', year)}
            className={`p-4 rounded-xl border-2 transition-all duration-200 font-semibold ${
              config.year === year
                ? 'border-purple-600 bg-purple-600 text-white shadow-md'
                : 'border-slate-200 bg-white text-slate-700 hover:border-purple-300'
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      {config.mode === 'learning' && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 flex items-center gap-2">
            <FileText size={16} />
            Questions available from 2010 to present
          </p>
        </div>
      )}
    </div>
  );

  // Step 5: Paper Selection
  const renderPaperSelection = () => {
    const papers = config.level === 'olevel' ? PAPERS.olevel : PAPERS.alevel;
    
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Select Paper Type</h1>
          <p className="text-slate-600">
            {config.subject} - {config.year}
          </p>
        </div>

        <div className="space-y-3">
          {papers.map((paper : string, index : number) => (
            <button
              key={paper}
              onClick={() => updateConfig('paper', paper)}
              className={`w-full p-5 rounded-xl border-2 transition-all duration-200 text-left ${
                config.paper === paper
                  ? 'border-purple-600 bg-purple-50 shadow-md'
                  : 'border-slate-200 bg-white hover:border-purple-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    config.paper === paper
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{paper}</h3>
                    <p className="text-sm text-slate-600">
                      {paper.includes('MCQ') ? 'Multiple Choice Questions' : 
                       paper.includes('Theory') ? 'Structured Questions' :
                       paper.includes('Practical') ? 'Laboratory/Field Work' : 'Extended Response'}
                    </p>
                  </div>
                </div>
                {config.paper === paper && (
                  <CheckCircle2 className="text-purple-600 shrink-0" size={24} />
                )}
              </div>
            </button>
          ))}
        </div>

        {config.mode === 'competition' && (
          <div className="mt-6 p-4 bg-linear-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Brain size={20} className="text-amber-600" />
              <span className="font-semibold text-amber-900">AI-Generated Questions</span>
            </div>
            <p className="text-sm text-amber-800">
              This week's challenge features {config.subject} questions generated by our AI 
              trained on {config.year} GCE patterns
            </p>
          </div>
        )}
      </div>
    );
  };

  // Progress Indicator
const renderProgress = () => (
  <div className="flex items-center justify-between mb-6 px-2">
    {[1, 2, 3, 4, 5].map((step) => (
      <div key={step} className="flex items-center flex-1">
        <div className={`rounded-full flex items-center justify-center font-bold transition-all ${
          step <= currentStep
            ? 'bg-purple-600 text-white'
            : 'bg-slate-200 text-slate-500'
        } ${
          // Responsive sizing: smaller on mobile, normal on md+
          'w-7 h-7 text-xs sm:w-8 sm:h-8 sm:text-sm'
        }`}>
          {step < currentStep ? (
            <CheckCircle2 
              size={14} 
              className="sm:size-16" 
            />
          ) : (
            step
          )}
        </div>
        {step < 5 && (
          <div className={`h-0.5 flex-1 mx-1 sm:mx-2 rounded transition-colors ${
            step < currentStep ? 'bg-purple-600' : 'bg-slate-200'
          }`} />
        )}
      </div>
    ))}
  </div>
);

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderLevelSelection();
      case 2: return renderModeSelection();
      case 3: return renderSubjectSelection();
      case 4: return renderYearSelection();
      case 5: return renderPaperSelection();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <Pressable
            onClick={currentStep > 1 ? handleBack : () => window.history.back()}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ChevronLeft size={24} className="text-slate-700" />
          </Pressable>
          <h2 className="font-bold text-lg text-slate-900">
            {currentStep === 1 && 'Practice'}
            {currentStep === 2 && 'Mode'}
            {currentStep === 3 && 'Subject'}
            {currentStep === 4 && 'Year'}
            {currentStep === 5 && 'Paper'}
          </h2>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {renderProgress()}
        {renderCurrentStep()}
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 safe-area-pb">
        <div className="max-w-lg mx-auto">
          {currentStep < totalSteps ? (
            <Pressable
              onClick={handleNext}
              disabled={!canProceed()}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                canProceed()
                  ? 'bg-primary text-white shadow-lg hover:bg-purple-700 active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Continue
            </Pressable>
          ) : (
            <Pressable
              onClick={startPractice}
              disabled={!canProceed()}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                canProceed()
                  ? 'bg-linear-to-r from-purple-600 to-primary text-white shadow-lg hover:shadow-xl active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <BookOpen size={20} />
              Start Practice
            </Pressable>
          )}
          
          {/* Summary for last step */}
          {currentStep === totalSteps && config.paper && (
            <div className="mt-3 p-3 bg-slate-50 rounded-lg text-center text-sm text-slate-600">
              {config.level === 'olevel' ? 'O-Level' : 'A-Level'} • {config.subject} • {config.year} • {config.paper}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticePage;
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export function Quiz() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const quizCount = 5; 
  const qKey = `learning_lab.questions.q${currentStep + 1}`;
  
  const currentQuestion = {
    question: t(`${qKey}.q`),
    options: t(`${qKey}.options`, { returnObjects: true }) as string[] || [],
    correct: [2, 1, 2, 1, 1][currentStep], 
    explanation: t(`${qKey}.explanation`)
  };

  const handleOptionClick = (idx: number) => {
    setSelectedOption(idx);
    const correct = idx === currentQuestion.correct;
    if (correct) setScore(score + 1);
  };

  const nextQuestion = () => {
    if (currentStep < quizCount - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedOption(null);
    } else {
      setShowResult(true);
    }
  };

  if (showResult) {
    return (
      <div className="text-center py-12">
        <h3 className="text-3xl font-bold text-white mb-4">{t('learning_lab.quiz_complete', 'Quiz Complete!')}</h3>
        <p className="text-5xl font-black text-blue-500 mb-6">{score} / {quizCount}</p>
        <button 
          onClick={() => {
            setCurrentStep(0);
            setSelectedOption(null);
            setScore(0);
            setShowResult(false);
          }}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all"
        >
          {t('learning_lab.reset', 'Try Again')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-xl font-bold text-white">{t('learning_lab.quiz_title', 'Civic Quiz')}</h3>
          <span className="text-slate-400 font-mono text-sm">{t('learning_lab.question_label', 'Question')} {currentStep + 1} {t('learning_lab.of_label', 'of')} {quizCount}</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / quizCount) * 100}%` }}
            className="h-full bg-blue-500"
          />
        </div>
      </div>

      <div className="bg-navy-900 border border-slate-700 p-8 rounded-3xl shadow-xl mb-6">
        <p className="text-xl text-slate-100 font-medium mb-8 leading-relaxed">
          {currentQuestion.question}
        </p>

        <div className="grid grid-cols-1 gap-4" role="radiogroup" aria-label="Quiz options">
          {currentQuestion.options.map((option, idx) => {
            let stateClass = "bg-slate-800 border-slate-700 hover:border-slate-500 text-slate-300";
            if (selectedOption === idx) {
              stateClass = idx === currentQuestion.correct 
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" 
                : "bg-rose-500/20 border-rose-500 text-rose-400";
            } else if (selectedOption !== null && idx === currentQuestion.correct) {
              stateClass = "bg-emerald-500/10 border-emerald-500/50 text-emerald-400/80";
            }

            return (
              <button
                key={idx}
                role="radio"
                aria-checked={selectedOption === idx}
                aria-label={`Option ${idx + 1}: ${option}`}
                disabled={selectedOption !== null}
                onClick={() => handleOptionClick(idx)}
                className={`w-full p-4 rounded-xl border text-left transition-all flex justify-between items-center ${stateClass}`}
              >
                <span>{option}</span>
                {selectedOption === idx && (
                  <span aria-hidden="true">{idx === currentQuestion.correct ? '✓' : '✗'}</span>
                )}
              </button>
            );
          })}
        </div>

        {selectedOption !== null && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50"
            aria-live="polite"
          >
            <p className="text-sm font-bold text-blue-400 mb-2 uppercase tracking-widest">{t('learning_lab.explanation_label', 'Why this is correct:')}</p>
            <p className="text-slate-300 text-sm leading-relaxed">{currentQuestion.explanation}</p>
            
            <button 
              onClick={nextQuestion}
              className="mt-6 w-full py-3 bg-slate-100 hover:bg-white text-navy-950 font-bold rounded-xl transition-all"
            >
              {currentStep < quizCount - 1 ? t('learning_lab.next', 'Next Question') : t('learning_lab.finish', 'Finish Quiz')}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

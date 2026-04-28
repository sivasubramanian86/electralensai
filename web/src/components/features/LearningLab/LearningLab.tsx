import { useState } from 'react';
import { Quiz } from './Quiz';
import { Flashcards } from './Flashcards';
import { motion } from 'framer-motion';

export function LearningLab() {
  const [activeTool, setActiveTool] = useState<'quiz' | 'flashcards'>('flashcards');

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center bg-navy-900/50 p-1.5 rounded-2xl border border-slate-800 w-fit mx-auto">
        <button
          onClick={() => setActiveTool('flashcards')}
          className={`px-8 py-2.5 rounded-xl font-bold transition-all ${
            activeTool === 'flashcards' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Flashcards
        </button>
        <button
          onClick={() => setActiveTool('quiz')}
          className={`px-8 py-2.5 rounded-xl font-bold transition-all ${
            activeTool === 'quiz' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Quick Quiz
        </button>
      </div>

      <motion.div
        key={activeTool}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {activeTool === 'flashcards' ? <Flashcards /> : <Quiz />}
      </motion.div>

      {/* Gamification Teaser */}
      <div className="bg-gradient-to-br from-indigo-900/40 to-blue-900/40 p-8 rounded-3xl border border-blue-500/20 text-center">
        <h4 className="text-xl font-bold text-white mb-2">Earn Your "Civic Scholar" Badge</h4>
        <p className="text-blue-200/70 mb-6">Complete 5 quizzes to unlock exclusive rewards and level up your democracy rank.</p>
        <div className="flex justify-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 border border-blue-500/30">🏅</div>
          <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-500 border border-slate-700/50">🔒</div>
          <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-500 border border-slate-700/50">🔒</div>
        </div>
      </div>
    </div>
  );
}

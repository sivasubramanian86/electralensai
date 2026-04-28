import { useState } from 'react';
import { CIVIC_MOCKS } from '../../../mocks/civicKnowledge';
import { motion, AnimatePresence } from 'framer-motion';

export function Flashcards() {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const cards = CIVIC_MOCKS.flashcards;
  const currentCard = cards[index];

  const next = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % cards.length);
    }, 200);
  };

  const prev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 200);
  };

  return (
    <div className="flex flex-col items-center space-y-8 py-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">Civic Flashcards</h3>
        <p className="text-slate-400">Master the basics of democracy, one card at a time.</p>
      </div>

      <div className="relative w-full max-w-md aspect-[3/2] cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={index + (isFlipped ? '-back' : '-front')}
            initial={{ rotateY: isFlipped ? -180 : 180, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: isFlipped ? 180 : -180, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className={`absolute inset-0 p-8 rounded-3xl flex flex-col items-center justify-center text-center shadow-2xl border ${
              isFlipped 
                ? 'bg-blue-600 border-blue-400' 
                : 'bg-navy-900 border-slate-700'
            }`}
          >
            <span className="absolute top-4 left-6 text-xs font-bold uppercase tracking-widest text-blue-400/60">
              {currentCard.category}
            </span>
            
            <p className={`text-2xl font-medium leading-relaxed ${isFlipped ? 'text-white' : 'text-slate-200'}`}>
              {isFlipped ? currentCard.answer : currentCard.question}
            </p>

            <span className="absolute bottom-4 text-xs text-slate-500 uppercase tracking-widest">
              Click to flip
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center space-x-6">
        <button 
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition-colors"
        >
          ←
        </button>
        <span className="text-slate-400 font-mono">
          {index + 1} / {cards.length}
        </span>
        <button 
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition-colors"
        >
          →
        </button>
      </div>
    </div>
  );
}

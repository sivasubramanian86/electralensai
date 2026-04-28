import React, { useState } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase';
import { LogIn, LogOut, User as UserIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LoginButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = React.useState(auth.currentUser);

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {user ? (
        <motion.div
          key="user-profile"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="flex items-center gap-4"
        >
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-xs font-bold text-white truncate max-w-[120px]">
              {user.displayName || 'Civic Explorer'}
            </span>
            <span className="text-[10px] text-blue-400 uppercase tracking-wider font-medium">Level 12 • Active</span>
          </div>
          
          <div className="relative group">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || 'User profile'} 
                role="img"
                className="w-9 h-9 rounded-full border border-white/20 shadow-lg group-hover:border-blue-500/50 transition-all cursor-pointer" 
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center border border-white/20 shadow-lg group-hover:shadow-blue-500/20 transition-all cursor-pointer">
                <UserIcon className="w-4 h-4 text-white" />
              </div>
            )}
            
            {/* Simple logout tooltip/dropdown on hover would be nice, but for now let's keep it simple or use a button next to it */}
          </div>

          <button
            onClick={handleLogout}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
            title="Sign Out"
            aria-label="Sign out from ElectraLens"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <LogOut className="w-4 h-4" />}
          </button>
        </motion.div>
      ) : (
        <motion.button
          key="login-btn"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogin}
          disabled={loading}
          aria-label="Sign in with Google"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-white/10 text-white font-semibold text-sm transition-all disabled:opacity-50 group"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" aria-hidden="true" />
          ) : (
            <>
              <LogIn className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
              <span>Sign In</span>
            </>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
};

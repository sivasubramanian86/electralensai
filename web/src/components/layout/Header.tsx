import { useTranslation } from 'react-i18next';
import { Search, Bell, Globe2, Command } from 'lucide-react';
import { LoginButton } from '../auth/LoginButton';

export type TabId = 'timeline' | 'ballot' | 'rumor' | 'simulation' | 'inclusive' | 'data' | 'knowledge' | 'audit';

export function Header() {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <header className="h-16 border-b border-white/5 bg-navy-950/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30">
      {/* Search Bar - Modern Mac Style */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <input 
            type="text" 
            placeholder={t('app.search_placeholder', 'Search regulations, polling booths, or claims...')}
            aria-label={t('app.search_aria', 'Search civic information')}
            className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-12 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] text-slate-500">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        {/* Notifications */}
        <button 
          className="relative p-2 text-slate-400 hover:text-white transition-colors"
          aria-label={t('app.notifications_aria', 'View notifications')}
          title={t('app.notifications', 'Notifications')}
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-navy-950" aria-hidden="true" />
        </button>

        {/* Language Selector */}
        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5 border border-white/10 hover:border-white/20 transition-all cursor-pointer">
          <Globe2 className="w-4 h-4 text-blue-400" />
          <select 
            className="bg-transparent text-sm text-slate-200 outline-none cursor-pointer appearance-none pr-2"
            value={i18n.language.split('-')[0]} 
            onChange={handleLanguageChange}
            aria-label="Change language"
            title="Switch Language"
          >
            <option value="en" className="bg-navy-900">{t('language.en', 'English')}</option>
            <option value="hi" className="bg-navy-900">{t('language.hi', 'Hindi')}</option>
            <option value="ta" className="bg-navy-900">{t('language.ta', 'Tamil')}</option>
            <option value="te" className="bg-navy-900">{t('language.te', 'Telugu')}</option>
            <option value="kn" className="bg-navy-900">{t('language.kn', 'Kannada')}</option>
            <option value="ml" className="bg-navy-900">{t('language.ml', 'Malayalam')}</option>
            <option value="bn" className="bg-navy-900">{t('language.bn', 'Bengali')}</option>
            <option value="gu" className="bg-navy-900">{t('language.gu', 'Gujarati')}</option>
            <option value="mr" className="bg-navy-900">{t('language.mr', 'Marathi')}</option>
            <option value="es" className="bg-navy-900">{t('language.es', 'Spanish')}</option>
            <option value="fr" className="bg-navy-900">{t('language.fr', 'French')}</option>
            <option value="de" className="bg-navy-900">{t('language.de', 'German')}</option>
          </select>
        </div>

        {/* User Authentication */}
        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <LoginButton />
        </div>
      </div>
    </header>
  );
}

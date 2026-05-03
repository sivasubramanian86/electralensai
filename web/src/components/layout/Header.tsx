import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Bell, Globe2, Command } from 'lucide-react';
import { LoginButton } from '../auth/LoginButton';

export type TabId = 'timeline' | 'ballot' | 'rumor' | 'simulation' | 'inclusive' | 'data' | 'knowledge' | 'audit';

export function Header() {
  const { t, i18n } = useTranslation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, titleKey: 'notif_reg_title', defaultTitle: 'Voter Registration', descKey: 'notif_reg_desc', defaultDesc: 'Deadline is approaching in 5 days!', timeKey: 'notif_time_2h', defaultTime: '2 hours ago', unread: true },
    { id: 2, titleKey: 'notif_myth_title', defaultTitle: 'Myth-Buster Alert', descKey: 'notif_myth_desc', defaultDesc: 'A new viral claim was just debunked.', timeKey: 'notif_time_5h', defaultTime: '5 hours ago', unread: true },
    { id: 3, titleKey: 'notif_achiev_title', defaultTitle: 'Achievement Unlocked', descKey: 'notif_achiev_desc', defaultDesc: 'You earned the "Timeline Explorer" badge!', timeKey: 'notif_time_1d', defaultTime: '1 day ago', unread: false },
  ]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter(n => n.unread).length;

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
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 hover:text-white transition-colors"
            aria-label={t('app.notifications_aria', 'View notifications')}
            title={t('app.notifications', 'Notifications')}
            aria-expanded={showNotifications}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-navy-950" aria-hidden="true" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-bold text-white">{t('app.notifications', 'Notifications')}</h3>
                {unreadCount > 0 && (
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">
                    {unreadCount} {t('app.new_notif', 'New')}
                  </span>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.map(notification => (
                  <button key={notification.id} className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 flex gap-3">
                    <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${notification.unread ? 'bg-blue-500' : 'bg-transparent'}`} />
                    <div>
                      <p className={`text-sm ${notification.unread ? 'text-white font-bold' : 'text-slate-300 font-medium'}`}>{t(`app.${notification.titleKey}`, notification.defaultTitle)}</p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{t(`app.${notification.descKey}`, notification.defaultDesc)}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{t(`app.${notification.timeKey}`, notification.defaultTime)}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-white/5">
                <button 
                  onClick={markAllAsRead}
                  className="w-full text-center text-xs text-blue-400 hover:text-blue-300 font-bold p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={unreadCount === 0}
                >
                  {t('app.mark_all_read', 'Mark all as read')}
                </button>
              </div>
            </div>
          )}
        </div>

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

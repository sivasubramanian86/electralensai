import { useState } from 'react';
import { Settings, Bell, Shield, User, Globe2, Moon, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function SettingsPanel() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Interactive States
  const [accessibilityMode, setAccessibilityMode] = useState('standard');
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [notificationPrefs, setNotificationPrefs] = useState({
    alerts: true,
    insights: false,
    security: true
  });

  const handleSave = () => {
    alert(t('settings.save_success', 'Settings saved successfully!'));
  };

  const handleDiscard = () => {
    setAccessibilityMode('standard');
    setAnalyticsEnabled(true);
    setNotificationPrefs({
      alerts: true,
      insights: false,
      security: true
    });
  };

  const tabs = [
    { id: 'profile', label: t('nav.profile', 'Profile'), icon: User },
    { id: 'notifications', label: t('nav.notifications', 'Notifications'), icon: Bell },
    { id: 'security', label: t('nav.security', 'Security & Privacy'), icon: Shield },
    { id: 'appearance', label: t('nav.appearance', 'Appearance'), icon: Moon },
    { id: 'language', label: t('nav.language', 'Language & Region'), icon: Globe2 },
  ];

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  const toggleNotification = (key: keyof typeof notificationPrefs) => {
    setNotificationPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <h3 className="text-xl font-bold text-white border-b border-white/5 pb-4">{t('settings.personalization', 'Personalization')}</h3>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label id="accessibility-label" className="text-sm font-bold text-slate-500 uppercase tracking-widest">{t('settings.accessibility_mode', 'Accessibility Mode')}</label>
                <div className="flex gap-4" role="group" aria-labelledby="accessibility-label">
                  <button 
                    onClick={() => setAccessibilityMode('standard')}
                    className={`flex-1 p-4 rounded-xl font-bold text-sm transition-all ${accessibilityMode === 'standard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`} 
                    aria-pressed={accessibilityMode === 'standard'}
                  >
                    {t('settings.mode_standard', 'Standard')}
                  </button>
                  <button 
                    onClick={() => setAccessibilityMode('contrast')}
                    className={`flex-1 p-4 rounded-xl font-bold text-sm transition-all ${accessibilityMode === 'contrast' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`} 
                    aria-pressed={accessibilityMode === 'contrast'}
                  >
                    {t('settings.mode_contrast', 'High Contrast')}
                  </button>
                  <button 
                    onClick={() => setAccessibilityMode('reader')}
                    className={`flex-1 p-4 rounded-xl font-bold text-sm transition-all ${accessibilityMode === 'reader' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`} 
                    aria-pressed={accessibilityMode === 'reader'}
                  >
                    {t('settings.mode_reader', 'Screen Reader')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <h3 className="text-xl font-bold text-white border-b border-white/5 pb-4">{t('settings.notification_prefs', 'Notification Preferences')}</h3>
            <div className="space-y-4">
              {[
                { id: 'alerts', title: t('settings.election_alerts', 'Election Alerts'), desc: t('settings.election_alerts_desc', 'Get notified about upcoming elections in your region.') },
                { id: 'insights', title: t('settings.agent_insights', 'Agent Insights'), desc: t('settings.agent_insights_desc', 'Receive summaries when agents find new data.') },
                { id: 'security', title: t('settings.security_alerts', 'Security Alerts'), desc: t('settings.security_alerts_desc', 'Important notifications about your account.') }
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="space-y-1">
                    <p className="text-white font-medium">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <button 
                    role="switch" 
                    aria-label={item.title}
                    aria-checked={notificationPrefs[item.id as keyof typeof notificationPrefs]}
                    onClick={() => toggleNotification(item.id as keyof typeof notificationPrefs)}
                    className={`w-12 h-6 rounded-full relative focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${notificationPrefs[item.id as keyof typeof notificationPrefs] ? 'bg-blue-600' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 bottom-1 w-4 h-4 bg-white rounded-full transition-all ${notificationPrefs[item.id as keyof typeof notificationPrefs] ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <h3 className="text-xl font-bold text-white border-b border-white/5 pb-4">{t('settings.security_privacy', 'Security & Privacy')}</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">{t('settings.data_privacy', 'Data Privacy')}</label>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="space-y-1">
                    <p className="text-white font-medium">{t('settings.anonymous_analytics', 'Anonymous Analytics')}</p>
                    <p className="text-xs text-slate-500">{t('settings.anonymous_analytics_desc', 'Help us improve without sharing your identity.')}</p>
                  </div>
                  <button 
                    role="switch" 
                    aria-label={t('settings.anonymous_analytics', 'Anonymous Analytics')}
                    aria-checked={analyticsEnabled}
                    onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                    className={`w-12 h-6 rounded-full relative focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${analyticsEnabled ? 'bg-blue-600' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 bottom-1 w-4 h-4 bg-white rounded-full transition-all ${analyticsEnabled ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <button 
                  onClick={() => alert(t('settings.export_alert', 'Data export requested. Check your email shortly.'))}
                  className="w-full p-4 rounded-xl bg-white/5 border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all font-bold text-sm text-left"
                >
                  {t('settings.request_export', 'Request Data Export')}
                </button>
                <button 
                  onClick={() => confirm(t('settings.delete_confirm', 'Are you sure you want to delete your account? This action cannot be undone.'))}
                  className="w-full p-4 rounded-xl bg-white/5 border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all font-bold text-sm text-left"
                >
                  {t('settings.delete_account', 'Delete Account')}
                </button>
              </div>
            </div>
          </div>
        );
      case 'appearance':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <h3 className="text-xl font-bold text-white border-b border-white/5 pb-4">{t('settings.appearance', 'Appearance Settings')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-6 rounded-xl bg-slate-900 border-2 border-blue-500 flex flex-col items-center gap-3 shadow-lg shadow-blue-500/10">
                <Moon className="w-8 h-8 text-blue-400" />
                <span className="text-white font-bold">{t('settings.dark_mode', 'Dark Mode')}</span>
              </button>
              <button className="p-6 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center gap-3 opacity-50 cursor-not-allowed hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-full bg-slate-400" />
                <span className="text-slate-400 font-bold">{t('settings.light_mode', 'Light Mode (Soon)')}</span>
              </button>
            </div>
          </div>
        );
      case 'language':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <h3 className="text-xl font-bold text-white border-b border-white/5 pb-4">{t('nav.language', 'Language & Region')}</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">{t('settings.interface_language', 'Interface Language')}</label>
                <select 
                  className="w-full p-4 rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-blue-500 outline-none hover:bg-slate-700 transition-colors cursor-pointer"
                  value={i18n.language.split('-')[0]}
                  onChange={handleLanguageChange}
                  aria-label={t('settings.interface_language', 'Interface Language')}
                >
                  <option value="en" className="bg-slate-800">{t('language.en', 'English')}</option>
                  <option value="hi" className="bg-slate-800">{t('language.hi', 'Hindi')}</option>
                  <option value="ta" className="bg-slate-800">{t('language.ta', 'Tamil')}</option>
                  <option value="te" className="bg-slate-800">{t('language.te', 'Telugu')}</option>
                  <option value="kn" className="bg-slate-800">{t('language.kn', 'Kannada')}</option>
                  <option value="ml" className="bg-slate-800">{t('language.ml', 'Malayalam')}</option>
                  <option value="bn" className="bg-slate-800">{t('language.bn', 'Bengali')}</option>
                  <option value="gu" className="bg-slate-800">{t('language.gu', 'Gujarati')}</option>
                  <option value="mr" className="bg-slate-800">{t('language.mr', 'Marathi')}</option>
                  <option value="es" className="bg-slate-800">{t('language.es', 'Spanish')}</option>
                  <option value="fr" className="bg-slate-800">{t('language.fr', 'French')}</option>
                  <option value="de" className="bg-slate-800">{t('language.de', 'German')}</option>
                </select>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-1000">
      <div className="space-y-2">
        <h2 className="text-4xl font-bold text-white flex items-center gap-4">
          <Settings className="w-10 h-10 text-slate-400" />
          {t('settings.title', 'System Settings')}
        </h2>
        <p className="text-slate-400 text-lg">
          {t('settings.description', 'Configure your ElectraLens AI experience, accessibility preferences, and account security.')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation Tabs */}
        <div className="md:col-span-1 space-y-2" role="tablist" aria-label={t('settings.sections', 'Settings sections')}>
          {tabs.map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={activeTab === item.id}
              aria-controls={`${item.id}-panel`}
              id={`${item.id}-tab`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all ${
                activeTab === item.id 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'animate-pulse' : ''}`} aria-hidden="true" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-2 space-y-8" role="tabpanel" id={`${activeTab}-panel`} aria-labelledby={`${activeTab}-tab`}>
          <div className="glass p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            
            <div className="relative">
              {renderContent()}

              <div className="pt-8 mt-8 border-t border-white/5 flex justify-end gap-4">
                <button 
                  onClick={handleDiscard}
                  className="px-8 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors focus:ring-2 focus:ring-white/10 focus:outline-none"
                >
                  {t('settings.discard', 'Discard')}
                </button>
                <button 
                  onClick={handleSave}
                  className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 focus:ring-2 focus:ring-blue-400 focus:outline-none active:scale-95"
                >
                  <Save className="w-4 h-4" aria-hidden="true" /> {t('settings.save', 'Save Changes')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

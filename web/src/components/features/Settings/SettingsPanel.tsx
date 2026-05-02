import { Settings, Bell, Shield, User, Globe2, Moon, Save } from 'lucide-react';

export function SettingsPanel() {

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-1000">
      <div className="space-y-2">
        <h2 className="text-4xl font-bold text-white flex items-center gap-4">
          <Settings className="w-10 h-10 text-slate-400" />
          System Settings
        </h2>
        <p className="text-slate-400 text-lg">
          Configure your ElectraLens AI experience, accessibility preferences, and account security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation Tabs */}
        <div className="md:col-span-1 space-y-2" role="tablist" aria-label="Settings sections">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'security', label: 'Security & Privacy', icon: Shield },
            { id: 'appearance', label: 'Appearance', icon: Moon },
            { id: 'language', label: 'Language & Region', icon: Globe2 },
          ].map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={item.id === 'profile'}
              aria-controls={`${item.id}-panel`}
              id={`${item.id}-tab`}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all ${
                item.id === 'profile' 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <item.icon className="w-5 h-5" aria-hidden="true" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-2 space-y-8" role="tabpanel" id="profile-panel" aria-labelledby="profile-tab">
          <div className="glass p-8 rounded-[2.5rem] border border-white/10 space-y-8">
            <div className="space-y-6">
               <h3 className="text-xl font-bold text-white border-b border-white/5 pb-4">Personalization</h3>
               
               <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                     <label id="accessibility-label" className="text-sm font-bold text-slate-500 uppercase tracking-widest">Accessibility Mode</label>
                     <div className="flex gap-4" role="group" aria-labelledby="accessibility-label">
                        <button className="flex-1 p-4 rounded-xl bg-blue-600 text-white font-bold text-sm" aria-pressed="true">Standard</button>
                        <button className="flex-1 p-4 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all" aria-pressed="false">High Contrast</button>
                        <button className="flex-1 p-4 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all" aria-pressed="false">Screen Reader</button>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Data Privacy</label>
                     <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="space-y-1">
                           <p className="text-white font-medium" id="analytics-label">Anonymous Analytics</p>
                           <p className="text-xs text-slate-500">Help us improve without sharing your identity.</p>
                        </div>
                        <button 
                          role="switch" 
                          aria-checked="true" 
                          aria-labelledby="analytics-label"
                          className="w-12 h-6 bg-blue-600 rounded-full relative focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                           <div className="absolute right-1 top-1 bottom-1 w-4 h-4 bg-white rounded-full" />
                        </button>
                     </div>
                  </div>
               </div>
            </div>

            <div className="pt-4 flex justify-end gap-4">
               <button className="px-8 py-3 rounded-xl text-slate-400 hover:text-white transition-colors focus:ring-2 focus:ring-white/10 focus:outline-none">Discard</button>
               <button className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20 hover:scale-105 transition-all flex items-center gap-2 focus:ring-2 focus:ring-blue-400 focus:outline-none">
                  <Save className="w-4 h-4" aria-hidden="true" /> Save Changes
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

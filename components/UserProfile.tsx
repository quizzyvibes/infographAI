
import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { HistoryItem } from '../src/types'; 
import { 
  User as UserIcon, Settings, Grid, Trash2, ZoomIn, 
  Clock, HardDrive, Zap, LogOut, Mail, Calendar, Shield, Crown
} from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

interface UserProfileProps {
  user: User | null;
  history: HistoryItem[];
  onLoadHistory: (item: HistoryItem) => void;
  onDeleteHistory: (id: string, path: string | undefined, e: React.MouseEvent) => void;
  onSignOut: () => void;
  isPro: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  user, 
  history, 
  onLoadHistory, 
  onDeleteHistory, 
  onSignOut,
  isPro
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'settings'>('library');

  // Mock Stats Calculation
  const totalGenerated = history.length;
  const storageUsed = (history.length * 1.2).toFixed(1); // Mock 1.2MB per image

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-fade-in pb-20">
      
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-20" />
        
        <div className="relative flex flex-col md:flex-row items-center md:items-end gap-6 pt-10">
          <div className="relative">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-xl object-cover" />
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <UserIcon className="w-16 h-16 text-slate-400" />
              </div>
            )}
            {isPro && (
              <div className="absolute bottom-1 right-1 bg-amber-500 text-white p-1.5 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" title="Visionary Member">
                <Crown className="w-4 h-4 fill-current" />
              </div>
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center md:justify-start gap-2">
              {user?.displayName || 'Guest Explorer'}
            </h1>
            <div className="flex flex-col md:flex-row gap-3 text-sm text-slate-500 dark:text-slate-400 items-center md:items-start">
              <span className="flex items-center gap-1"><Mail className="w-4 h-4"/> {user?.email || 'No email linked'}</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> Member since {user?.metadata.creationTime ? new Date(user.metadata.creationTime).getFullYear() : '2025'}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="text-center px-4 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{totalGenerated}</div>
              <div className="text-xs text-slate-500 uppercase font-bold tracking-wide">Creations</div>
            </div>
            <div className="text-center px-4 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{storageUsed}MB</div>
              <div className="text-xs text-slate-500 uppercase font-bold tracking-wide">Storage</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-6 border-b border-slate-200 dark:border-slate-700 mb-8">
        <button 
          onClick={() => setActiveTab('library')}
          className={`pb-4 px-2 flex items-center gap-2 font-bold transition-all relative ${activeTab === 'library' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          <Grid className="w-5 h-5" /> Library
          {activeTab === 'library' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`pb-4 px-2 flex items-center gap-2 font-bold transition-all relative ${activeTab === 'settings' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          <Settings className="w-5 h-5" /> Settings
          {activeTab === 'settings' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />}
        </button>
      </div>

      {/* CONTENT AREA */}
      {activeTab === 'library' && (
        <div className="animate-fade-in">
          {history.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
              <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Grid className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Your library is empty</h3>
              <p className="text-slate-500">Create your first infographic to see it here!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {history.map((item) => (
                <div key={item.id} className="group bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="relative aspect-square bg-slate-100 dark:bg-slate-900 overflow-hidden">
                    <img src={item.imageUrl} alt={item.topic.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                      <button 
                        onClick={() => onLoadHistory(item)} 
                        className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-full font-bold text-sm hover:bg-indigo-50 transition-colors"
                      >
                        <ZoomIn className="w-4 h-4"/> View
                      </button>
                      <button 
                        onClick={(e) => onDeleteHistory(item.id, item.storagePath, e)} 
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-100 border border-red-500/50 rounded-full font-bold text-sm hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <Trash2 className="w-4 h-4"/> Delete
                      </button>
                    </div>
                    {/* Badge */}
                    <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">
                      {item.format}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate mb-1" title={item.topic.title}>{item.topic.title}</h3>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{item.subject}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
          {/* Account Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-500" /> Account & Security
            </h3>
            
            <div className="space-y-6">
               <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                 <div>
                   <div className="font-semibold text-slate-700 dark:text-slate-200">Email Notifications</div>
                   <div className="text-xs text-slate-500">Get updates on new features.</div>
                 </div>
                 <div className="relative inline-block w-12 h-6 rounded-full bg-slate-300 dark:bg-slate-600 cursor-pointer">
                    <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform"></span>
                 </div>
               </div>

               <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                 <div>
                   <div className="font-semibold text-slate-700 dark:text-slate-200">Public Profile</div>
                   <div className="text-xs text-slate-500">Allow others to see your creations.</div>
                 </div>
                 <div className="relative inline-block w-12 h-6 rounded-full bg-indigo-500 cursor-pointer">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-transform"></span>
                 </div>
               </div>

               {user && (
                 <button onClick={onSignOut} className="w-full py-3 mt-4 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center justify-center gap-2 transition-colors">
                   <LogOut className="w-4 h-4" /> Sign Out
                 </button>
               )}
            </div>
          </div>

          {/* App Preferences */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" /> App Preferences
            </h3>
            
            <div className="space-y-4">
               <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Default Subject</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm">
                    <option>Select...</option>
                    <option>Science</option>
                    <option>History</option>
                  </select>
               </div>
               
               <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Default Resolution</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm" disabled={!isPro}>
                    <option>1K (Standard)</option>
                    <option>2K (High Def) {isPro ? '' : '(Pro)'}</option>
                  </select>
               </div>
               
               <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-sm text-blue-700 dark:text-blue-300 flex gap-2">
                 <HardDrive className="w-5 h-5 flex-shrink-0" />
                 <div>
                   <span className="font-bold">Data Storage:</span> Your history is stored safely {user ? 'in the cloud' : 'in your browser'}.
                 </div>
               </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};






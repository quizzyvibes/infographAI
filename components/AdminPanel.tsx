
import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, Image as ImageIcon, BrainCircuit, Activity, 
  Search, ShieldAlert, Trash2, Ban, Save, RefreshCw, 
  Terminal, Server, Lock, Globe, AlertTriangle, Cpu, ToggleLeft
} from 'lucide-react';
import { HistoryItem } from '../src/types';

interface AdminPanelProps {
  onExit: () => void;
  allHistory?: HistoryItem[];
}

type Tab = 'dashboard' | 'users' | 'content' | 'ai-config' | 'system';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  
  // Mock State for AI Config
  const [systemPrompt, setSystemPrompt] = useState(`You are an expert Art Director. Create a one-page infographic...`);
  const [temperature, setTemperature] = useState(0.7);
  const [safetyThreshold, setSafetyThreshold] = useState('BLOCK_ONLY_HIGH');
  const [modelType, setModelType] = useState('gemini-3-pro-image-preview');

  // Mock Users
  const [users] = useState([
    { id: '1', email: 'admin@infograph.ai', role: 'Admin', status: 'Active', usage: 1450, lastActive: 'Now' },
    { id: '2', email: 'user.john@gmail.com', role: 'User', status: 'Active', usage: 120, lastActive: '2h ago' },
    { id: '3', email: 'spambot@bad.com', role: 'User', status: 'Banned', usage: 0, lastActive: '5d ago' },
    { id: '4', email: 'teacher.sarah@edu.org', role: 'Pro', status: 'Active', usage: 560, lastActive: '1d ago' },
  ]);

  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Users className="w-24 h-24 text-blue-500" />
        </div>
        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">Total Users</h3>
        <div className="text-4xl font-bold text-white mt-2">8,420</div>
        <div className="text-emerald-400 text-sm mt-2 flex items-center gap-1">
          <Activity className="w-3 h-3" /> +12% this week
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <ImageIcon className="w-24 h-24 text-purple-500" />
        </div>
        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">Generations</h3>
        <div className="text-4xl font-bold text-white mt-2">142.5k</div>
        <div className="text-emerald-400 text-sm mt-2 flex items-center gap-1">
          <Activity className="w-3 h-3" /> +5% today
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <BrainCircuit className="w-24 h-24 text-amber-500" />
        </div>
        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">API Costs (Est)</h3>
        <div className="text-4xl font-bold text-white mt-2">$342.10</div>
        <div className="text-slate-400 text-sm mt-2">Current Billing Period</div>
      </div>

      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Server className="w-24 h-24 text-rose-500" />
        </div>
        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">System Health</h3>
        <div className="text-4xl font-bold text-emerald-400 mt-2">99.9%</div>
        <div className="text-slate-400 text-sm mt-2">All systems operational</div>
      </div>

      <div className="md:col-span-2 lg:col-span-4 bg-slate-900 rounded-2xl border border-slate-700 p-6 font-mono text-sm">
        <h3 className="text-slate-400 font-bold mb-4 flex items-center gap-2">
          <Terminal className="w-4 h-4" /> Live System Logs
        </h3>
        <div className="space-y-2 h-48 overflow-y-auto custom-scrollbar text-slate-300">
           <div className="flex gap-4"><span className="text-slate-500">10:42:01</span> <span className="text-emerald-400">[INFO]</span> New user registration: u_8921a</div>
           <div className="flex gap-4"><span className="text-slate-500">10:42:15</span> <span className="text-blue-400">[GEN]</span> Generating Infographic: "Photosynthesis"</div>
           <div className="flex gap-4"><span className="text-slate-500">10:42:18</span> <span className="text-blue-400">[GEN]</span> Image generation success (2.4s)</div>
           <div className="flex gap-4"><span className="text-slate-500">10:43:05</span> <span className="text-amber-400">[WARN]</span> High latency detected (400ms)</div>
        </div>
      </div>
    </div>
  );

  const renderAiConfig = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-white font-bold flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-purple-500"/> System Prompt (Master Template)</h3>
             <button className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded-full transition-colors">Reset to Default</button>
          </div>
          <p className="text-slate-400 text-sm mb-4">
            This is the "Gold Standard" template injected into every image generation request. Editing this changes the output style globally.
          </p>
          <textarea 
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full h-96 bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-300 font-mono text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none"
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <h3 className="text-white font-bold mb-6 flex items-center gap-2"><Cpu className="w-5 h-5 text-blue-500"/> Model Configuration</h3>
          
          <div className="space-y-6">
            <div>
              <label className="text-sm text-slate-400 block mb-2">Target Image Model</label>
              <select 
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm"
              >
                <option value="gemini-3-pro-image-preview">Gemini 3 Pro Image (High Quality)</option>
                <option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image (Fast)</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-slate-400 block mb-2 flex justify-between">
                <span>Creativity (Temperature)</span>
                <span className="text-white font-mono">{temperature}</span>
              </label>
              <input 
                type="range" 
                min="0" max="1" step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400 block mb-2">Safety Filters</label>
              <select 
                value={safetyThreshold}
                onChange={(e) => setSafetyThreshold(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm"
              >
                <option value="BLOCK_NONE">Block None (Dangerous)</option>
                <option value="BLOCK_ONLY_HIGH">Block Only High</option>
                <option value="BLOCK_MEDIUM_AND_ABOVE">Block Medium+</option>
              </select>
            </div>
            
            <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
               <Save className="w-4 h-4" /> Deploy Configuration
            </button>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-amber-900/50">
          <h3 className="text-amber-500 font-bold mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> Danger Zone</h3>
          <p className="text-xs text-slate-400 mb-4">
            Changes here affect production immediately.
          </p>
          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg mb-2">
             <span className="text-sm text-slate-300">Maintenance Mode</span>
             <ToggleLeft className="w-8 h-8 text-slate-600 cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden animate-fade-in">
       <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-white font-bold flex items-center gap-2"><Users className="w-5 h-5" /> User Database</h3>
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
             <input type="text" placeholder="Search email..." className="bg-slate-900 border border-slate-600 text-white pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
          </div>
       </div>
       <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-900/50 text-slate-200 uppercase text-xs">
             <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">API Usage</th>
                <th className="px-6 py-4">Last Active</th>
                <th className="px-6 py-4 text-right">Actions</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
             {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-700/50 transition-colors">
                   <td className="px-6 py-4 font-medium text-white">{u.email}</td>
                   <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs border ${u.role === 'Admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : u.role === 'Pro' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                         {u.role}
                      </span>
                   </td>
                   <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 ${u.status === 'Active' ? 'text-emerald-400' : 'text-red-400'}`}>
                         <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                         {u.status}
                      </span>
                   </td>
                   <td className="px-6 py-4 font-mono">{u.usage} req</td>
                   <td className="px-6 py-4">{u.lastActive}</td>
                   <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button className="p-1.5 hover:bg-slate-600 rounded text-slate-400 hover:text-white" title="View Details"><Search className="w-4 h-4" /></button>
                      <button className="p-1.5 hover:bg-red-900/30 rounded text-slate-400 hover:text-red-400" title="Ban User"><Ban className="w-4 h-4" /></button>
                   </td>
                </tr>
             ))}
          </tbody>
       </table>
       <div className="p-4 border-t border-slate-700 flex justify-center">
          <button className="text-sm text-slate-400 hover:text-white">Load more users...</button>
       </div>
    </div>
  );

  const renderContentModeration = () => (
    <div className="animate-fade-in space-y-6">
       <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
          <div className="flex items-center gap-4">
             <h3 className="text-white font-bold flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-rose-500"/> Content Moderation Queue</h3>
             <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 bg-rose-500/20 text-rose-300 rounded border border-rose-500/30">12 Reported</span>
                <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded border border-slate-600">All Recent</span>
             </div>
          </div>
          <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm flex items-center gap-2"><RefreshCw className="w-4 h-4"/> Refresh</button>
       </div>

       <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
             <div key={i} className="group relative aspect-square bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                <img src={`https://source.unsplash.com/random/400x400?infographic&sig=${i}`} alt="Content" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                   <p className="text-xs text-white font-bold truncate">Generated Content #{i}</p>
                   <p className="text-[10px] text-slate-400">User: user_{i}23</p>
                   <div className="flex gap-2 mt-2">
                      <button className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-1.5 rounded flex items-center justify-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
                      <button className="flex-1 bg-slate-600 hover:bg-slate-500 text-white text-xs py-1.5 rounded flex items-center justify-center gap-1">Log</button>
                   </div>
                </div>
                {i % 3 === 0 && (
                   <div className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Reported
                   </div>
                )}
             </div>
          ))}
       </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 text-slate-200 font-sans flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
           <Lock className="w-5 h-5 text-rose-500 mr-2" />
           <span className="font-bold text-lg tracking-tight text-white">ADMIN<span className="text-slate-500">PANEL</span></span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
             <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
             <Users className="w-5 h-5" /> User Management
          </button>
          <button onClick={() => setActiveTab('content')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'content' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
             <ImageIcon className="w-5 h-5" /> Content Mod
          </button>
          <div className="pt-4 pb-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">System & AI</div>
          <button onClick={() => setActiveTab('ai-config')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'ai-config' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
             <BrainCircuit className="w-5 h-5" /> AI Brain Config
          </button>
          <button onClick={() => setActiveTab('system')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'system' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
             <Globe className="w-5 h-5" /> Feature Flags
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
           <button onClick={onExit} className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-700 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-sm">
              Exit Control Room
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-slate-950">
         <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
            <h2 className="text-xl font-bold text-white capitalize">{activeTab.replace('-', ' ')}</h2>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 text-xs font-mono">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  SYSTEM ONLINE
               </div>
               <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">AD</div>
            </div>
         </header>
         
         <div className="p-8">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'content' && renderContentModeration()}
            {activeTab === 'ai-config' && renderAiConfig()}
            {activeTab === 'system' && (
               <div className="text-center py-20 bg-slate-900 rounded-2xl border border-slate-800 border-dashed">
                  <Globe className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-400">Global System Settings</h3>
                  <p className="text-slate-500">Configure regions, languages, and global announcements here.</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};


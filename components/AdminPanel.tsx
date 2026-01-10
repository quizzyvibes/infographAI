
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Image as ImageIcon, BrainCircuit, Activity, 
  Search, ShieldAlert, Trash2, Ban, Save, RefreshCw, 
  Terminal, Server, Lock, Globe, AlertTriangle, Cpu, ToggleLeft, ToggleRight, ShoppingBag, CheckCircle2
} from 'lucide-react';
import { HistoryItem, ShopBundle } from '../src/types';
import { getSystemConfig, saveSystemConfig, getAllUsers, toggleUserBan } from '../src/services/dbService';
import { AdminShopManager } from './AdminShopManager';

interface AdminPanelProps {
  onExit: () => void;
  onSaveShopBundle?: (bundle: ShopBundle) => void;
}

type Tab = 'site-performance' | 'users' | 'content' | 'ai-config' | 'system' | 'shop-manager';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onExit, onSaveShopBundle }) => {
  const [activeTab, setActiveTab] = useState<Tab>('site-performance');
  
  // Real State for AI Config
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [safetyThreshold, setSafetyThreshold] = useState('BLOCK_ONLY_HIGH');
  const [modelType, setModelType] = useState('gemini-3-pro-image-preview');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Default Fallback Prompt
  const DEFAULT_PROMPT = `
    You are an expert Art Director for educational infographics.
    Write a single, highly detailed image generation prompt for a text-to-image model.
    
    DESIGN STYLE: High-end, vector-art educational infographic. 
    Flat design, clean lines, vibrant but professional color palette (Deep Blue, Teal, Gold, Soft White).
    Typography should be legible, sans-serif, and hierarchical (Headings, Subheadings, Body).
    Avoid photorealism; prefer stylized, clear, and explanatory scientific illustration.
    White background or very light neutral background for clarity.
    
    VISUAL HIERARCHY:
    1. Title: Large, bold, at the top.
    2. Central Visual: The main concept illustrated clearly in the center.
    3. Data Points: Surrounding stats, charts, or bullet points.
    4. Flow: Eye should move logically from top-left to bottom-right (or center-out).
    
    INSTRUCTIONS:
    - Describe the layout specifically (Mindmap, Flowchart, or Standard).
    - Include specific text labels found in the source material.
    - Ensure margins are clear if specified.
    - Output raw prompt text only.
  `.trim();

  useEffect(() => {
     if (activeTab === 'ai-config') {
       loadConfig();
     }
     if (activeTab === 'users') {
       loadUsers();
     }
  }, [activeTab]);

  const loadConfig = async () => {
    setLoadingConfig(true);
    try {
      const config = await getSystemConfig();
      if (config) {
        setSystemPrompt(config.systemPrompt || DEFAULT_PROMPT);
        setTemperature(config.temperature ?? 0.7);
        setSafetyThreshold(config.safetyThreshold || 'BLOCK_ONLY_HIGH');
        setModelType(config.imageModel || 'gemini-3-pro-image-preview');
        setMaintenanceMode(config.maintenanceMode || false);
      } else {
        // First run defaults
        setSystemPrompt(DEFAULT_PROMPT);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingConfig(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleBanUser = async (uid: string, currentStatus: string) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus === 'Banned' ? 'unban' : 'ban'} this user?`)) return;
    try {
      const newStatus = await toggleUserBan(uid, currentStatus || 'Active');
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, status: newStatus } : u));
    } catch (e) {
      alert("Failed to update user status");
    }
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      await saveSystemConfig({
        systemPrompt,
        temperature,
        safetyThreshold,
        imageModel: modelType,
        maintenanceMode
      });
      setSaveMessage("Successfully Deployed");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (e) {
      console.error(e);
      setSaveMessage("Error saving config.");
    } finally {
      setSavingConfig(false);
    }
  };

  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Activity className="w-24 h-24 text-indigo-500" />
        </div>
        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">Total Generations</h3>
        <div className="text-4xl font-bold text-white mt-2">12,543</div>
      </div>
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <BrainCircuit className="w-24 h-24 text-emerald-500" />
        </div>
        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">API Health</h3>
        <div className="text-4xl font-bold text-emerald-400 mt-2">99.8%</div>
      </div>
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Users className="w-24 h-24 text-blue-500" />
        </div>
        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">Total Users</h3>
        <div className="text-4xl font-bold text-white mt-2">{users.length > 0 ? users.length : '8,420'}</div>
      </div>
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <ShoppingBag className="w-24 h-24 text-amber-500" />
        </div>
        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">Shop Sales</h3>
        <div className="text-4xl font-bold text-white mt-2">$4,250</div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden animate-fade-in">
       {loadingUsers ? (
         <div className="p-8 text-center text-slate-400">Loading user data...</div>
       ) : (
         <table className="w-full text-left border-collapse">
            <thead>
               <tr className="bg-slate-900 border-b border-slate-700">
                  <th className="p-4 text-sm font-bold text-slate-400 uppercase">User</th>
                  <th className="p-4 text-sm font-bold text-slate-400 uppercase">Role</th>
                  <th className="p-4 text-sm font-bold text-slate-400 uppercase">Status</th>
                  <th className="p-4 text-sm font-bold text-slate-400 uppercase">Last Active</th>
                  <th className="p-4 text-sm font-bold text-slate-400 uppercase">Actions</th>
               </tr>
            </thead>
            <tbody>
               {users.map(u => (
                  <tr key={u.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                     <td className="p-4 font-bold text-white">
                       <div>{u.displayName || 'No Name'}</div>
                       <div className="text-xs text-slate-500 font-normal">{u.email}</div>
                     </td>
                     <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'Admin' ? 'bg-purple-900 text-purple-300' : 'bg-slate-700 text-slate-300'}`}>{u.role || 'User'}</span>
                     </td>
                     <td className="p-4">
                        <span className={`flex items-center gap-1.5 text-sm ${u.status === 'Active' ? 'text-emerald-400' : 'text-red-400'}`}>
                           <span className={`w-2 h-2 rounded-full ${u.status === 'Active' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                           {u.status || 'Active'}
                        </span>
                     </td>
                     <td className="p-4 text-slate-300 text-sm">
                       {u.lastActive ? new Date(u.lastActive).toLocaleDateString() : 'Unknown'}
                     </td>
                     <td className="p-4 flex gap-2">
                        <button 
                          onClick={() => handleBanUser(u.id, u.status)}
                          className="p-2 bg-slate-900 hover:bg-red-900/50 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                          title={u.status === 'Banned' ? "Unban User" : "Ban User"}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-slate-900 hover:bg-blue-900/50 rounded-lg text-slate-400 hover:text-blue-400 transition-colors"><Search className="w-4 h-4" /></button>
                     </td>
                  </tr>
               ))}
               {users.length === 0 && (
                 <tr>
                   <td colSpan={5} className="p-8 text-center text-slate-500">No users found. Login with an account to populate data.</td>
                 </tr>
               )}
            </tbody>
         </table>
       )}
    </div>
  );

  const renderAiConfig = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in relative">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-400" /> System Instruction (Meta-Prompt)
            </h3>
            <span className="text-xs text-slate-500 font-mono">v3.4.0</span>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            This prompt governs the persona, style constraints, and JSON formatting rules for the Topic Generator and Image Prompter.
          </p>
          <div className="relative">
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full h-[600px] bg-slate-950 border border-slate-700 rounded-xl p-6 text-emerald-400 font-mono text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none leading-relaxed custom-scrollbar"
              spellCheck={false}
            />
            <div className="absolute top-4 right-4 bg-slate-800/80 backdrop-blur px-2 py-1 rounded text-xs text-slate-400 border border-slate-700">
              {systemPrompt.length} chars
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Save Status */}
        {saveMessage && (
          <div className={`p-4 rounded-xl border ${saveMessage.includes('Error') ? 'bg-red-900/20 border-red-900 text-red-300' : 'bg-emerald-900/20 border-emerald-900 text-emerald-300'} flex items-center gap-3 animate-slide-down`}>
            {saveMessage.includes('Error') ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <span className="font-bold text-sm">{saveMessage}</span>
          </div>
        )}

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm space-y-6">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" /> Model Parameters
          </h3>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Temperature ({temperature})</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Image Generation Model</label>
            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm focus:border-blue-500 outline-none"
            >
              <option value="gemini-3-pro-image-preview">Gemini 3 Pro Image (Premium)</option>
              <option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image (Fast)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Safety Filter Threshold</label>
            <select
              value={safetyThreshold}
              onChange={(e) => setSafetyThreshold(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm focus:border-blue-500 outline-none"
            >
              <option value="BLOCK_NONE">Block None (Risky)</option>
              <option value="BLOCK_ONLY_HIGH">Block Only High (Standard)</option>
              <option value="BLOCK_MEDIUM_AND_ABOVE">Block Medium & Above (Safe)</option>
              <option value="BLOCK_LOW_AND_ABOVE">Block Low & Above (Strict)</option>
            </select>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm">
          <h3 className="font-bold text-white flex items-center gap-2 mb-4">
            <Server className="w-5 h-5 text-amber-400" /> System Controls
          </h3>
          
          <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-700">
             <div>
                <div className="text-sm font-bold text-slate-200">Maintenance Mode</div>
                <div className="text-xs text-slate-500">Disable generation for users</div>
             </div>
             <button 
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${maintenanceMode ? 'bg-amber-500' : 'bg-slate-600'}`}
             >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
             </button>
          </div>
        </div>

        <button 
          onClick={handleSaveConfig} 
          disabled={savingConfig}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {savingConfig ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {savingConfig ? "Deploying..." : "Deploy Configuration"}
        </button>
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
          <button onClick={() => setActiveTab('site-performance')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'site-performance' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
             <LayoutDashboard className="w-5 h-5" /> Site Performance
          </button>
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
             <Users className="w-5 h-5" /> User Management
          </button>
          <button onClick={() => setActiveTab('shop-manager')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'shop-manager' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
             <ShoppingBag className="w-5 h-5" /> Shop Manager
          </button>
          <button onClick={() => setActiveTab('ai-config')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'ai-config' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
             <BrainCircuit className="w-5 h-5" /> AI Brain Config
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
               <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">AD</div>
            </div>
         </header>
         
         <div className="p-8">
            {activeTab === 'site-performance' && renderDashboard()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'shop-manager' && onSaveShopBundle && (
                <AdminShopManager onSaveBundle={(b) => { onSaveShopBundle(b); }} />
            )}
            {activeTab === 'ai-config' && renderAiConfig()}
         </div>
      </div>
    </div>
  );
};










import React, { useState } from 'react';
import { AppDepartment, AppView, AppUser } from '../src/types';
import { 
  Menu, X, ShoppingCart, User as UserIcon, LogIn, LogOut, 
  Aperture, Palette, ShoppingBag, GraduationCap, Crown
} from 'lucide-react';

interface GlobalNavbarProps {
  currentDept: AppDepartment;
  onNavigate: (dept: AppDepartment, view?: AppView) => void;
  user: AppUser | null;
  onOpenAuth: () => void;
  signOut: () => void;
  onOpenProfile: () => void;
  isPro: boolean;
  cartCount?: number;
}

export const GlobalNavbar: React.FC<GlobalNavbarProps> = ({ 
  currentDept, onNavigate, user, onOpenAuth, signOut, onOpenProfile, isPro, cartCount = 0 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: AppDepartment.CREATE, label: 'Create', icon: Palette },
    { id: AppDepartment.SHOP, label: 'Shop', icon: ShoppingBag },
    { id: AppDepartment.LEARN, label: 'Learn', icon: GraduationCap },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-lg border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => onNavigate(AppDepartment.LANDING)}
          >
            <div className="relative">
               <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-400 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity"></div>
               <div className="relative bg-slate-900 border border-white/10 p-2 rounded-xl shadow-inner flex items-center justify-center">
                 <Aperture className="w-6 h-6 text-cyan-400" />
               </div>
            </div>
            <div className="flex flex-col">
               <span className="font-extrabold text-xl tracking-tighter leading-none text-white">
                 Info<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Pic</span>
               </span>
            </div>
          </div>

          <div className="hidden md:flex space-x-1 bg-slate-800/50 p-1 rounded-full border border-slate-700">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id, AppView.HOME)}
                className={`px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${currentDept === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
              >
                <item.icon className="w-4 h-4" /> {item.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => onNavigate(AppDepartment.SHOP, AppView.CART)} className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-bounce">{cartCount}</span>}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                {isPro && <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-full border border-amber-500/20"><Crown className="w-3 h-3 fill-current" /></div>}
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-slate-700 cursor-pointer hover:border-blue-500 transition-colors" onClick={onOpenProfile}>
                   {user.photoURL ? <img src={user.photoURL} alt="User" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs">{user.displayName?.charAt(0) || 'U'}</div>}
                </div>
                <button onClick={signOut} className="text-slate-500 hover:text-red-400 transition-colors" title="Sign Out">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button onClick={onOpenAuth} className="flex items-center gap-2 px-5 py-2 bg-white text-slate-900 rounded-full text-sm font-bold hover:bg-slate-200 transition-colors">
                <LogIn className="w-4 h-4" /> Sign In
              </button>
            )}
          </div>

          <div className="md:hidden flex items-center gap-4">
             <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
               {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
             </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-slate-900 border-b border-slate-800 p-4 shadow-2xl animate-slide-down">
           <div className="flex flex-col space-y-2 mb-6">
              {navItems.map((item) => (
                <button key={item.id} onClick={() => { onNavigate(item.id, AppView.HOME); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${currentDept === item.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <item.icon className="w-5 h-5" /> {item.label}
                </button>
              ))}
           </div>
           <div className="border-t border-slate-800 pt-4">
              {user ? (
                <div className="space-y-4">
                   <div className="flex items-center gap-3" onClick={() => { onOpenProfile(); setIsMobileMenuOpen(false); }}>
                      <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center font-bold text-white">{user.displayName?.charAt(0) || 'U'}</div>
                      <div>
                         <div className="text-white font-bold">{user.displayName}</div>
                         <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                   </div>
                   <button onClick={signOut} className="w-full py-3 flex items-center justify-center gap-2 text-red-400 bg-red-900/10 rounded-xl text-sm font-bold">
                      <LogOut className="w-4 h-4" /> Sign Out
                   </button>
                </div>
              ) : (
                <button onClick={() => { onOpenAuth(); setIsMobileMenuOpen(false); }} className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2">
                   <LogIn className="w-4 h-4" /> Sign In / Sign Up
                </button>
              )}
           </div>
        </div>
      )}
    </nav>
  );
};








import React, { useState } from 'react';
import { AppDepartment, AppView, AppUser } from '../src/types';
import { 
  Menu, X, ShoppingCart, LogIn, LogOut, 
  Aperture, Palette, ShoppingBag, GraduationCap, Crown, User
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
  
  const navItems = [
    { id: AppDepartment.CREATE, label: 'Create', icon: Palette },
    { id: AppDepartment.SHOP, label: 'Shop', icon: ShoppingBag },
    { id: AppDepartment.LEARN, label: 'Learn', icon: GraduationCap },
  ];

  const handleNavClick = (id: AppDepartment) => {
     onNavigate(id, id === AppDepartment.CREATE ? AppView.GENERATOR : AppView.HOME);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* LOGO AREA */}
            <div 
              className="flex items-center gap-3 cursor-pointer group flex-shrink-0" 
              onClick={() => onNavigate(AppDepartment.LANDING)}
            >
              <div className="relative">
                 <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-400 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity"></div>
                 <div className="relative bg-slate-900 border border-white/10 p-2 rounded-xl shadow-inner flex items-center justify-center">
                   <Aperture className="w-6 h-6 text-cyan-400" />
                 </div>
              </div>
              <div className="flex flex-col">
                 <span className="font-extrabold text-xl tracking-tighter leading-none text-white hidden sm:block">
                   Info<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Pic</span>
                 </span>
                 {/* Mobile Text Only */}
                 <span className="font-extrabold text-lg tracking-tighter leading-none text-white sm:hidden">
                   Info<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Pic</span>
                 </span>
              </div>
            </div>

            {/* SPACER FOR MOBILE */}
            <div className="flex-1 md:hidden"></div>

            {/* DESKTOP NAV ITEMS (Great 4 Buttons) */}
            <div className="hidden md:flex space-x-1 bg-slate-800/50 p-1 rounded-full border border-slate-700 mx-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${currentDept === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                >
                  <item.icon className="w-4 h-4" /> {item.label}
                </button>
              ))}
            </div>

            {/* RIGHT ACTIONS (Mobile & Desktop) - Lined up */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button onClick={() => onNavigate(AppDepartment.SHOP, AppView.CART)} className="relative p-2 text-slate-400 hover:text-white transition-colors">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                {cartCount > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-bounce">{cartCount}</span>}
              </button>

              {user ? (
                <>
                  {isPro && <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-full border border-amber-500/20"><Crown className="w-3 h-3 fill-current" /></div>}
                  
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-slate-700 cursor-pointer hover:border-blue-500 transition-colors flex-shrink-0" onClick={onOpenProfile}>
                     {user.photoURL ? <img src={user.photoURL} alt="User" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs">{user.displayName?.charAt(0) || 'U'}</div>}
                  </div>
                  
                  <button onClick={signOut} className="text-slate-500 hover:text-red-400 transition-colors p-1" title="Sign Out">
                    <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </>
              ) : (
                <button onClick={onOpenAuth} className="flex items-center gap-2 px-3 sm:px-5 py-2 bg-white text-slate-900 rounded-full text-xs sm:text-sm font-bold hover:bg-slate-200 transition-colors whitespace-nowrap">
                  <LogIn className="w-4 h-4" /> <span className="hidden sm:inline">Sign In</span> <span className="sm:hidden">Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE TRIO NAVIGATION BAR - REDESIGNED */}
      <div className="md:hidden sticky top-16 z-40 flex justify-center mt-2 pointer-events-none">
         <div className="pointer-events-auto flex items-center bg-slate-900/90 backdrop-blur-xl border border-slate-500 rounded-full shadow-2xl p-1.5 gap-1 mx-4 max-w-sm w-full animate-slide-down">
            {navItems.map((item) => (
               <button
                 key={item.id}
                 onClick={() => handleNavClick(item.id)}
                 className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full transition-all duration-300 font-bold text-sm ${currentDept === item.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
               >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
               </button>
            ))}
         </div>
      </div>
    </>
  );
};









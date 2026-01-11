
import React from 'react';
import { CartItem, ShopBundle } from '../src/types';
import { Trash2, ArrowRight, ShieldCheck, ShoppingBag, ArrowLeft } from 'lucide-react';

interface CartPageProps {
  items: CartItem[];
  onRemove: (id: string) => void;
  onCheckout: () => void;
  onContinueShopping: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({ items, onRemove, onCheckout, onContinueShopping }) => {
  const subtotal = items.reduce((sum, item) => sum + (item.bundle.price * item.quantity), 0);
  const tax = subtotal * 0.08; // Mock tax
  const total = subtotal + tax;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in">
         <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-10 h-10 text-slate-500" />
         </div>
         <h2 className="text-3xl font-bold text-white mb-2">Your cart is empty</h2>
         <p className="text-slate-400 mb-8">Looks like you haven't discovered our bundles yet.</p>
         <button 
           onClick={onContinueShopping}
           className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold transition-colors"
         >
            Start Shopping
         </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-12 animate-fade-in">
      {/* Mobile-First "Continue Shopping" Button (Moved to Top) */}
      <div className="md:hidden mb-6">
         <button 
           onClick={onContinueShopping}
           className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xl flex items-center justify-center gap-2 shadow-lg"
         >
            <ArrowLeft className="w-6 h-6" /> Continue Shopping
         </button>
      </div>

      <h1 className="text-3xl font-bold text-white mb-8">Shopping Cart ({items.length})</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
         {/* Cart Items List */}
         <div className="lg:col-span-2 space-y-6">
            {items.map((item) => (
               <div key={item.bundle.id} className="flex gap-4 md:gap-6 p-4 bg-slate-800 rounded-xl border border-slate-700 items-center">
                  <div className="w-24 h-24 bg-slate-900 rounded-lg overflow-hidden flex-shrink-0 border border-slate-600">
                     <img src={item.bundle.thumbnailUrl} alt={item.bundle.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                     <h3 className="font-bold text-white text-lg truncate">{item.bundle.title}</h3>
                     <p className="text-sm text-slate-400 mb-2">{item.bundle.subject} • {item.bundle.format}</p>
                     <div className="text-emerald-400 font-bold">${item.bundle.price}</div>
                  </div>
                  <button 
                    onClick={() => onRemove(item.bundle.id)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-full transition-colors"
                  >
                     <Trash2 className="w-5 h-5" />
                  </button>
               </div>
            ))}
            
            {/* Desktop Continue Shopping */}
            <button onClick={onContinueShopping} className="hidden md:flex text-indigo-400 hover:text-indigo-300 font-bold text-sm items-center gap-1 mt-4">
               ← Continue Shopping
            </button>
         </div>

         {/* Order Summary */}
         <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 sticky top-24">
               <h3 className="text-xl font-bold text-white mb-6">Order Summary</h3>
               
               <div className="space-y-3 mb-6 border-b border-slate-700 pb-6">
                  <div className="flex justify-between text-slate-400">
                     <span>Subtotal</span>
                     <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                     <span>Tax (Est.)</span>
                     <span>${tax.toFixed(2)}</span>
                  </div>
               </div>
               
               <div className="flex justify-between text-white font-bold text-xl mb-8">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
               </div>
               
               <button 
                 onClick={onCheckout}
                 className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/20 transition-all mb-4"
               >
                  Secure Checkout <ArrowRight className="w-5 h-5" />
               </button>
               
               <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4" /> SSL Encrypted Payment
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};


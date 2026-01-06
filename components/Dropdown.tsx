import React from 'react';

interface DropdownProps {
  label: React.ReactNode;
  value: string;
  options: string[] | { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({ 
  label, 
  value, 
  options, 
  onChange, 
  disabled = false, 
  loading = false,
  placeholder = "Select an option"
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 block">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || loading}
          className={`
            w-full appearance-none rounded-lg border px-3 py-2.5 shadow-sm transition-all
            bg-white dark:bg-slate-800 
            border-slate-300 dark:border-slate-600
            text-slate-900 dark:text-slate-200
            focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500
            disabled:opacity-60 disabled:cursor-not-allowed
            ${value === "" ? "text-slate-500 dark:text-slate-500" : ""}
          `}
        >
          <option value="" disabled className="text-slate-500 bg-slate-50 dark:bg-slate-800">
            {loading ? "Loading..." : placeholder}
          </option>
          {options.map((opt) => {
            const isString = typeof opt === 'string';
            const optValue = isString ? opt : opt.value;
            const optLabel = isString ? opt : opt.label;
            return (
              <option key={optValue} value={optValue} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200">
                {optLabel}
              </option>
            );
          })}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
          {loading ? (
             <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};
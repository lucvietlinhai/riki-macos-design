import React from 'react';
import { useTheme } from '../theme';

interface SwitchProps {
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  Icon?: React.FC<{className?: string}>;
}

export const Switch: React.FC<SwitchProps> = ({ label, enabled, onChange, Icon }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-[10px] sm:text-sm">
        {Icon && <Icon className={`w-4 h-4 sm:w-5 h-5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />}
        <span className={`font-bold uppercase tracking-tight ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>{label}</span>
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`${
          enabled ? (isDark ? 'bg-orange-500' : 'bg-black') : (isDark ? 'bg-zinc-800' : 'bg-slate-300')
        } relative inline-flex h-5 w-10 sm:h-6 sm:w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-orange-500 focus:ring-offset-zinc-900' : 'focus:ring-black focus:ring-offset-white'} focus:ring-offset-2`}
        role="switch"
        aria-checked={enabled}
      >
        <span
          aria-hidden="true"
          className={`${
            enabled ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
      </button>
    </div>
  );
};
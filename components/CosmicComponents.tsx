import React from 'react';

export const CosmicButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  disabled?: boolean;
}> = ({ onClick, children, variant = 'primary', className = '', disabled = false }) => {
  const baseStyle = "relative px-6 py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 overflow-hidden group";
  
  const variants = {
    primary: "bg-gradient-to-r from-cosmic-accent to-cosmic-glow text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:shadow-[0_0_25px_rgba(168,85,247,0.7)]",
    secondary: "bg-cosmic-800 border border-cosmic-700 text-slate-300 hover:border-cosmic-glow hover:text-white",
    danger: "bg-red-900/50 border border-red-700 text-red-200 hover:bg-red-800"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''} ${className}`}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
      {!disabled && variant === 'primary' && (
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
      )}
    </button>
  );
};

export const StarBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div className="absolute w-[2px] h-[2px] bg-white rounded-full top-1/4 left-1/4 animate-twinkle"></div>
      <div className="absolute w-[3px] h-[3px] bg-blue-300 rounded-full top-1/2 left-2/3 animate-twinkle delay-700"></div>
      <div className="absolute w-[2px] h-[2px] bg-purple-300 rounded-full top-3/4 left-1/3 animate-twinkle delay-1000"></div>
      <div className="absolute w-[1px] h-[1px] bg-white rounded-full top-10 left-10 animate-twinkle"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cosmic-800/20 via-cosmic-900 to-black"></div>
    </div>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-cosmic-800/80 backdrop-blur-md border border-cosmic-700 rounded-xl p-6 shadow-xl ${className}`}>
    {children}
  </div>
);

export const Badge: React.FC<{ text: string; color?: string }> = ({ text, color = "bg-cosmic-700" }) => (
  <span className={`${color} px-2 py-1 rounded text-xs font-mono uppercase tracking-wider text-white border border-white/10`}>
    {text}
  </span>
);
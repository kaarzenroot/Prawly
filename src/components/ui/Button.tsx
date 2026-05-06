import { motion } from "motion/react";
import { type ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  type?: "button" | "submit";
}

export function Button({ children, onClick, variant = "primary", className = "", type = "button" }: ButtonProps) {
  const baseStyles = "font-display uppercase tracking-widest font-bold px-6 py-2 rounded-lg border-[3px] transition-all duration-300 active:scale-95 flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-primary-container text-surface border-primary-container shadow-[0_0_15px_rgba(255,191,0,0.4)] hover:scale-105 hover:shadow-[0_0_25px_rgba(255,191,0,0.6)]",
    secondary: "bg-transparent text-secondary border-secondary/30 hover:border-secondary hover:text-secondary hover:scale-105",
    ghost: "bg-transparent text-on-surface-variant border-transparent hover:text-primary-container"
  };

  return (
    <motion.button
      type={type}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}

// components/svg/sad-face.tsx
import { motion, Variants } from "framer-motion";

export default function InteractiveFace() {
  // Tipando como Variants para o TS parar de reclamar do 'ease'
  const mouthVariants: Variants = {
    sad: {
      d: "M 30 70 Q 50 55 70 70",
      transition: { duration: 0.5, ease: "easeInOut" }
    },
    happy: {
      d: "M 30 65 Q 50 85 70 65",
      transition: { duration: 0.4, ease: "backOut" }
    }
  };

  const tearVariants: Variants = {
    sad: {
      opacity: [0, 1, 0],
      y: [0, 10], 
      transition: { 
        duration: 2, 
        repeat: Infinity, 
        repeatDelay: 1,
        ease: "linear" 
      }
    },
    happy: {
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    // O container define o tamanho relativo
    <div className="w-full h-full flex items-center justify-center">
      <motion.svg
        viewBox="0 0 100 100"
        className="w-full h-full text-current cursor-pointer overflow-visible"
        initial="sad"
        whileHover="happy"
      >
        {/* Rosto - Com animação de respiração independente das variants */}
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Olhos */}
        <circle cx="35" cy="40" r="5" fill="currentColor" />
        <circle cx="65" cy="40" r="5" fill="currentColor" />

        {/* Boca - Transição suave via Variants */}
        <motion.path
          variants={mouthVariants}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Lágrima - Posicionada acima para não encostar na boca feliz */}
        <motion.circle
          cx="35"
          cy="48" 
          r="2.5"
          className="fill-blue-400"
          variants={tearVariants}
        />

        {/* HITBOX: Círculo invisível que cobre tudo para o hover ser sensível */}
        <circle 
          cx="50" 
          cy="50" 
          r="50" 
          fill="transparent" 
          className="pointer-events-auto"
        />
      </motion.svg>
    </div>
  );
}
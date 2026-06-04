import { useState } from 'react';
import { motion } from 'framer-motion';

export function LoadingScreen() {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center h-screen bg-[#1B3A5C] text-white overflow-hidden select-none"
    >
      {/* 1. Container do logo com molduras animadas */}
      <div className="relative w-64 h-64 mb-4 flex items-center justify-center">
        
        {/* Moldura Externa (Maior) - Pulsar, Girar e Suavizar Bordas */}
        <motion.div
          animate={{
            scale: [1.2, 1, 1, 1.2, 1.2],
            rotate: [270, 0, 0, 270, 270],
            opacity: [0.25, 1, 1, 1, 0.25],
            borderRadius: ['25%', '25%', '50%', '50%', '25%']
          }}
          transition={{ ease: 'linear', duration: 3.2, repeat: Infinity }}
          className="absolute w-[200px] h-[200px] border-[3px] border-[#4A90D9] pointer-events-none"
        />

        {/* Moldura Interna (Menor) - Movimento Oposto Concêntrico */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1.2, 1, 1],
            rotate: [-270, 0, 0, -270, -270],
            opacity: [1, 0.25, 0.25, 1, 1],
            borderRadius: ['50%', '50%', '25%', '25%', '50%']
          }}
          transition={{ ease: 'linear', duration: 3.2, repeat: Infinity }}
          className="absolute w-[150px] h-[150px] border-[3px] border-[#7BB8F0]/40 pointer-events-none"
        />

        {/* Logo pulsando e girando em 3D (Y-axis) */}
        <motion.div
          animate={{ rotateY: [0, 360, 360] }}
          transition={{ duration: 3, times: [0, 0.667, 1], repeat: Infinity, ease: 'easeInOut' }}
          className="absolute z-10 flex items-center justify-center"
          style={{ perspective: 1000 }}
        >
          {!imgError ? (
            <img
              src="/images/genefy-logo-navbar.png"
              alt="Genefy"
              className="w-28 object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <defs>
                <linearGradient id="drop-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7B9EFF" />
                  <stop offset="100%" stopColor="#3A5BD9" />
                </linearGradient>
              </defs>
              <path
                d="M28 4 C28 4 10 22 10 34 C10 43.9 18.1 52 28 52 C37.9 52 46 43.9 46 34 C46 22 28 4 28 4Z"
                fill="url(#drop-grad)"
              />
              <line x1="28" y1="20" x2="28" y2="44" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity={0.9} />
              <line x1="21" y1="27" x2="35" y2="27" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity={0.9} />
              <line x1="21" y1="34" x2="35" y2="34" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity={0.9} />
              <line x1="21" y1="40" x2="35" y2="40" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity={0.55} />
            </svg>
          )}
        </motion.div>
      </div>

      {/* 2. Textos */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col items-center mt-2"
      >
        <p className="text-white text-2xl font-semibold mb-1">Genefy</p>
        <p className="text-blue-300 text-sm tracking-wide mb-6">Matching Genético Bovino</p>
      </motion.div>

      {/* 3. Três dots animados */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-2"
      >
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: 0 }}
          className="w-2 h-2 rounded-full bg-[#4A90D9]"
        />
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
          className="w-2 h-2 rounded-full bg-[#4A90D9]"
        />
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
          className="w-2 h-2 rounded-full bg-[#4A90D9]"
        />
      </motion.div>
    </motion.div>
  );
}

export default LoadingScreen;

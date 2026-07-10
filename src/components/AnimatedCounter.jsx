import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minimize2, X } from 'lucide-react';

/**
 * Hook para animar el conteo de números
 */
const useCountUp = (end, duration = 2000, startOnMount = true) => {
  const [count, setCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!startOnMount) return;
    
    setIsAnimating(true);
    let startTime = null;
    const startValue = 0;
    let animationFrameId = null;
    
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.floor(startValue + (end - startValue) * easeOut);
      
      setCount(currentCount);
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCount(end);
        setIsAnimating(false);
      }
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    // Cleanup function para cancelar la animación si el componente se desmonta
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [end, duration, startOnMount]);

  const restart = useCallback(() => {
    setCount(0);
    setIsAnimating(true);
    let startTime = null;
    const startValue = 0;
    let animationFrameId = null;
    
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.floor(startValue + (end - startValue) * easeOut);
      
      setCount(currentCount);
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCount(end);
        setIsAnimating(false);
      }
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [end, duration]);

  return [count, isAnimating, restart];
};

/**
 * Componente de contador animado con modal
 */
export const AnimatedCounter = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  color = 'purple',
  modalContent 
}) => {
  const [count, , restart] = useCountUp(value);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const colorClasses = {
    purple: {
      icon: 'text-purple-400',
      bg: 'bg-purple-600/20',
      border: 'border-purple-500/30',
      hover: 'hover:bg-purple-600/30',
      text: 'text-purple-200'
    },
    blue: {
      icon: 'text-blue-400',
      bg: 'bg-blue-600/20',
      border: 'border-blue-500/30',
      hover: 'hover:bg-blue-600/30',
      text: 'text-blue-200'
    },
    green: {
      icon: 'text-green-400',
      bg: 'bg-green-600/20',
      border: 'border-green-500/30',
      hover: 'hover:bg-green-600/30',
      text: 'text-green-200'
    },
    orange: {
      icon: 'text-orange-400',
      bg: 'bg-orange-600/20',
      border: 'border-orange-500/30',
      hover: 'hover:bg-orange-600/30',
      text: 'text-orange-200'
    },
    pink: {
      icon: 'text-pink-400',
      bg: 'bg-pink-600/20',
      border: 'border-pink-500/30',
      hover: 'hover:bg-pink-600/30',
      text: 'text-pink-200'
    }
  };

  const colors = colorClasses[color] || colorClasses.purple;

  const handleCardClick = () => {
    setIsModalOpen(true);
    setIsFullscreen(false);
    restart();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      restart();
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setIsFullscreen(false);
  };

  // Manejar la tecla Escape para cerrar
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleClose();
      }
    };
    
    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  return (
    <>
      <div 
        className={`bg-black/40 border-2 ${colors.border} rounded-lg cursor-pointer transition-all duration-200 ${colors.hover} p-6`}
        onClick={handleCardClick}
      >
        <div className="flex flex-row items-center justify-between space-y-0">
          <div className="flex-1">
            <p className="text-sm font-medium text-purple-200 mb-2">
              {title}
            </p>
            <div className="text-4xl font-bold text-white mb-1">
              {count.toLocaleString()}
            </div>
            <p className="text-xs text-purple-300">
              {description}
            </p>
          </div>
          <div className={`${colors.icon} ${colors.bg} p-3 rounded-lg ml-4`}>
            {Icon && <Icon className="h-8 w-8" />}
          </div>
        </div>
      </div>

      {/* Modal grande */}
      {isModalOpen && createPortal(
        <div 
          className={`fixed z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-all duration-300 inset-0`}
          onClick={!isFullscreen ? handleClose : undefined}
        >
          <div 
            className={`bg-zinc-950 border border-purple-500/30 rounded-lg shadow-2xl transition-all duration-300 ${
              isFullscreen 
                ? 'w-full h-full rounded-none border-none p-12' 
                : 'p-8 max-w-2xl w-full mx-4'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                {Icon && (
                  <div className={`${colors.icon} ${colors.bg} ${isFullscreen ? 'p-6 rounded-xl' : 'p-4 rounded-lg'}`}>
                    <Icon className={isFullscreen ? 'h-16 w-16' : 'h-12 w-12'} />
                  </div>
                )}
                <div>
                  <h2 className={`font-bold text-white ${isFullscreen ? 'text-5xl' : 'text-3xl'}`}>{title}</h2>
                  <p className={`text-purple-300 mt-1 ${isFullscreen ? 'text-xl' : ''}`}>{description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleFullscreen}
                  className={`${colors.icon} hover:text-white transition-colors p-2`}
                  title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                >
                  {isFullscreen ? (
                    <Minimize2 className={isFullscreen ? 'h-8 w-8' : 'h-6 w-6'} />
                  ) : (
                    <Maximize2 className="h-6 w-6" />
                  )}
                </button>
                <button
                  onClick={handleClose}
                  className={`${colors.icon} hover:text-white transition-colors p-2`}
                  title="Cerrar"
                >
                  <X className={isFullscreen ? 'h-8 w-8' : 'h-6 w-6'} />
                </button>
              </div>
            </div>
            
            <div className={`text-center ${isFullscreen ? 'py-16' : 'py-8'}`}>
              <div className={`font-bold mb-4 ${colors.icon} ${isFullscreen ? 'text-9xl' : 'text-8xl'}`}>
                {count.toLocaleString()}
              </div>
              {modalContent && (
                <div className={`mt-6 text-purple-200 ${isFullscreen ? 'text-2xl' : ''}`}>
                  {modalContent}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export { useCountUp };


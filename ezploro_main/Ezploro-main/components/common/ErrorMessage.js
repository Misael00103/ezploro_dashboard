import React from 'react';

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
      <svg 
        className="w-16 h-16 text-red-500 mb-4" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
        />
      </svg>
      
      <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
        ¡Oops! Algo salió mal
      </h3>
      
      <p className="text-red-600 dark:text-red-300 text-center mb-4">
        {message || 'Ha ocurrido un error inesperado'}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
        >
          Intentar de nuevo
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;

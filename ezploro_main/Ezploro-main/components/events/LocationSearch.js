import React from 'react';

const LocationSearch = ({ 
  value, 
  onChange, 
  suggestions = [], 
  onSelectSuggestion,
  loading = false,
  placeholder = 'Buscar lugar o dirección...'
}) => {
  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
        />
        
        {loading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-gray-400 border-t-purple-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-gray-900 border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
          <div className="p-2 border-b border-white/10 bg-purple-900/20">
            <p className="text-xs text-gray-400">
              {suggestions.length} sugerencia{suggestions.length !== 1 ? 's' : ''} encontrada{suggestions.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.place_id || index}`}
              onClick={() => onSelectSuggestion(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-start gap-3 border-b border-white/5 last:border-b-0"
            >
              <svg className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {suggestion.name || suggestion.display_name?.split(',')[0]}
                </p>
                <p className="text-gray-400 text-xs truncate">
                  {suggestion.display_name || suggestion.address}
                </p>
              </div>
              
              <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;

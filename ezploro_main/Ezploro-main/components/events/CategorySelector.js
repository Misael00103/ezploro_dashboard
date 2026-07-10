import React from 'react';

const CategorySelector = ({ categories, selected, onChange, label = 'Categoría' }) => {
  return (
    <div className="mb-6">
      <label className="block text-white text-base font-semibold mb-3">
        {label}
      </label>
      <div className="grid grid-cols-2 gap-3">
        {categories.map((category) => (
          <button
            key={category.value}
            type="button"
            onClick={() => onChange(category.value)}
            className={`p-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
              selected === category.value
                ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg scale-105'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelector;

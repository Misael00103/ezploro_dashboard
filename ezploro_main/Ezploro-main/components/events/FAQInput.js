import React from 'react';

const FAQInput = ({ faqs = [], onChange }) => {
  const addFaq = () => {
    onChange([...faqs, { id: Date.now(), question: '', answer: '' }]);
  };

  const updateFaq = (index, field, value) => {
    const updated = faqs.map((faq, i) => 
      i === index ? { ...faq, [field]: value } : faq
    );
    onChange(updated);
  };

  const removeFaq = (index) => {
    onChange(faqs.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <div 
          key={faq.id || index}
          className="bg-white/5 border border-white/10 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-purple-400 text-sm font-semibold">
              FAQ {index + 1}
            </span>
            {faqs.length > 1 && (
              <button
                type="button"
                onClick={() => removeFaq(index)}
                className="text-red-500 hover:text-red-400 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>

          <input
            type="text"
            value={faq.question}
            onChange={(e) => updateFaq(index, 'question', e.target.value)}
            placeholder="Escribe tu pregunta..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors mb-3"
          />

          <textarea
            value={faq.answer}
            onChange={(e) => updateFaq(index, 'answer', e.target.value)}
            placeholder="Escribe la respuesta..."
            rows={3}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addFaq}
        className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Agregar Pregunta
      </button>
    </div>
  );
};

export default FAQInput;

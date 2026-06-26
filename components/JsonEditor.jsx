'use client';

import { useState } from 'react';

export default function JsonEditor({ value, onChange, label, error }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [jsonError, setJsonError] = useState(null);

  const formattedJson = JSON.stringify(value, null, 2);

  const handleChange = (e) => {
    const newValue = e.target.value;
    
    try {
      const parsed = JSON.parse(newValue);
      setJsonError(null);
      onChange(parsed);
    } catch (err) {
      setJsonError(err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-semibold text-gray-900">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      
      <textarea
        value={formattedJson}
        onChange={handleChange}
        rows={isExpanded ? 30 : 10}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono resize-none ${
          jsonError || error ? 'border-red-300' : 'border-gray-300'
        }`}
        placeholder="JSON configuration..."
      />
      
      {(jsonError || error) && (
        <p className="mt-2 text-sm text-red-600">
          {jsonError || error}
        </p>
      )}
      
      <p className="mt-2 text-sm text-gray-500">
        Edit the JSON configuration directly. Make sure it's valid JSON format.
      </p>
    </div>
  );
}

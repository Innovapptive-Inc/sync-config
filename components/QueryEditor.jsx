'use client';

import { useState } from 'react';

export default function QueryEditor({ collectionName, query, onChange, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localQuery, setLocalQuery] = useState(query);

  const handleQueryChange = (e) => {
    const newQuery = e.target.value;
    setLocalQuery(newQuery);
    onChange(newQuery);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h4 className="font-semibold text-gray-900">{collectionName}</h4>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="text-sm text-red-600 hover:text-red-700 font-medium"
          title="Delete this subscription"
        >
          Delete
        </button>
      </div>
      
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">
          N1QL Query
        </label>
        <textarea
          value={localQuery}
          onChange={handleQueryChange}
          rows={isExpanded ? 8 : 3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono resize-none bg-gray-50"
          placeholder="SELECT * FROM ..."
        />
        <p className="mt-1 text-xs text-gray-500">
          N1QL/SQL++ query for this collection subscription
        </p>
      </div>
    </div>
  );
}

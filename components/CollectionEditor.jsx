'use client';

import { useState } from 'react';

export default function CollectionEditor({ collection, onChange, onDelete, sectionTitle, defaultExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleFieldChange = (field, value) => {
    onChange({
      ...collection,
      [field]: value,
    });
  };

  const handleFiltersChange = (e) => {
    try {
      const parsed = JSON.parse(e.target.value);
      handleFieldChange('filters', parsed);
    } catch (err) {
      // Keep the text value for editing
    }
  };

  const handleFilterMappingChange = (e) => {
    try {
      const parsed = JSON.parse(e.target.value);
      handleFieldChange('filterMapping', parsed);
    } catch (err) {
      // Keep the text value for editing
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h4 className="font-semibold text-gray-900">{collection.name}</h4>
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
            {collection.syncType || 'DITTO'}
          </span>
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
          title="Delete this collection"
        >
          Delete
        </button>
      </div>

      <div className="space-y-3">
        {/* Name - Read-only */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Collection Name (Read-only)
          </label>
          <div className="px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm font-mono text-gray-900">
            {collection.name}
          </div>
          <p className="text-xs text-gray-500 mt-1">Collection name cannot be changed after creation</p>
        </div>

        {isExpanded && (
          <>
            {/* Sync Type */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Sync Type
              </label>
              <select
                value={collection.syncType || 'DITTO'}
                onChange={(e) => handleFieldChange('syncType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
              >
                <option value="DITTO">DITTO</option>
                <option value="CUSTOM">CUSTOM</option>
              </select>
            </div>

            {/* Filters */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Filters (JSON)
              </label>
              <textarea
                value={JSON.stringify(collection.filters || {}, null, 2)}
                onChange={handleFiltersChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs font-mono resize-none bg-gray-50"
              />
            </div>

            {/* Filter Mapping */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Filter Mapping (JSON)
              </label>
              <textarea
                value={JSON.stringify(collection.filterMapping || {}, null, 2)}
                onChange={handleFilterMappingChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs font-mono resize-none bg-gray-50"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

export default function AddBaseCollectionDialog({ isOpen, onClose, onAdd, type, saving }) {
  const [collectionName, setCollectionName] = useState('');
  const [step, setStep] = useState(1);
  
  const getInitialConfig = () => {
    switch(type) {
      case 'base':
        return {
          syncType: 'DITTO',
          hasStatusFilter: false,
          statusValues: ['1'],
          includeNullStatus: false,
          customFilters: [],
          filterMappings: [],
        };
      case 'masterPlant':
        return {
          syncType: 'DITTO',
          hasStatusFilter: true,
          statusValues: ['1'],
          includeNullStatus: true,
          customFilters: [],
          filterMappings: [],
        };
      case 'transactional':
        return {
          syncType: 'DITTO',
          hasStatusFilter: false,
          statusValues: ['1'],
          includeNullStatus: false,
          customFilters: [],
          filterMappings: [
            { key: 'plantId', value: 'plant' },
            { key: 'updatedAt', value: 'updatedAt' },
          ],
        };
      default:
        return {
          syncType: 'DITTO',
          hasStatusFilter: false,
          statusValues: ['1'],
          includeNullStatus: false,
          customFilters: [],
          filterMappings: [],
        };
    }
  };

  const [config, setConfig] = useState(getInitialConfig());
  const [mode, setMode] = useState('builder');

  if (!isOpen) return null;

  const getTitle = () => {
    switch(type) {
      case 'base': return 'Add New Base Collection';
      case 'masterPlant': return 'Add New Master Plant Collection';
      case 'transactional': return 'Add New Transactional Collection';
      default: return 'Add New Collection';
    }
  };

  const handleNext = () => {
    if (collectionName.trim()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleCancel = () => {
    setCollectionName('');
    setStep(1);
    setConfig(getInitialConfig());
    onClose();
  };

  const buildFilters = () => {
    const filters = {};

    if (config.hasStatusFilter) {
      if (config.includeNullStatus) {
        filters.$or = [
          { status: { $exists: false } },
          { status: { $in: config.statusValues.map(v => v === '1' || v === '2' ? parseInt(v) : v) } },
        ];
      } else {
        filters.status = {
          $in: config.statusValues.map(v => v === '1' || v === '2' ? parseInt(v) : v),
        };
      }
    }

    config.customFilters.forEach(filter => {
      if (filter.field && filter.value) {
        filters[filter.field] = { [filter.operator || '$eq']: filter.value };
      }
    });

    return filters;
  };

  const buildFilterMapping = () => {
    const mapping = {};
    config.filterMappings.forEach(m => {
      if (m.key && m.value) {
        mapping[m.key] = m.value;
      }
    });
    return mapping;
  };

  const handleSaveAndAdd = async () => {
    const newCollection = {
      name: collectionName.trim(),
      syncType: config.syncType,
      filters: buildFilters(),
      filterMapping: buildFilterMapping(),
    };
    
    await onAdd(newCollection);
    handleCancel();
  };

  const addCustomFilter = () => {
    setConfig({
      ...config,
      customFilters: [...config.customFilters, { field: '', operator: '$eq', value: '' }],
    });
  };

  const removeCustomFilter = (index) => {
    setConfig({
      ...config,
      customFilters: config.customFilters.filter((_, i) => i !== index),
    });
  };

  const updateCustomFilter = (index, field, value) => {
    const newFilters = [...config.customFilters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    setConfig({ ...config, customFilters: newFilters });
  };

  const addFilterMapping = () => {
    setConfig({
      ...config,
      filterMappings: [...config.filterMappings, { key: '', value: '' }],
    });
  };

  const removeFilterMapping = (index) => {
    setConfig({
      ...config,
      filterMappings: config.filterMappings.filter((_, i) => i !== index),
    });
  };

  const updateFilterMapping = (index, field, value) => {
    const newMappings = [...config.filterMappings];
    newMappings[index] = { ...newMappings[index], [field]: value };
    setConfig({ ...config, filterMappings: newMappings });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-900">{getTitle()}</h3>
              <p className="text-sm text-gray-500">Step {step} of 2</p>
            </div>
          </div>
          <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 ? (
            <div>
              <label htmlFor="collectionName" className="block text-sm font-medium text-gray-700 mb-2">
                Collection Name <span className="text-red-500">*</span>
              </label>
              <input
                id="collectionName"
                type="text"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleNext()}
                autoFocus
                placeholder="Enter collection name (e.g., MyCollection)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
              <p className="mt-2 text-sm text-gray-500">
                Enter the MongoDB collection name (case-sensitive). This cannot be changed later.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-900">
                  <strong>Collection:</strong> {collectionName}
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setMode('builder')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === 'builder'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-300'
                  }`}
                >
                  🎨 Visual Builder
                </button>
                <button
                  type="button"
                  onClick={() => setMode('raw')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === 'raw'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-300'
                  }`}
                >
                  📝 Raw JSON
                </button>
              </div>

              {mode === 'builder' ? (
                <>
                  {/* Sync Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sync Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={config.syncType}
                      onChange={(e) => setConfig({ ...config, syncType: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base bg-white"
                    >
                      <option value="DITTO">DITTO</option>
                      <option value="CUSTOM">CUSTOM</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="checkbox"
                        checked={config.hasStatusFilter}
                        onChange={(e) => setConfig({ ...config, hasStatusFilter: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <label className="text-sm font-medium text-gray-700">Status Filter</label>
                    </div>
                    {config.hasStatusFilter && (
                      <div className="ml-7 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={config.includeNullStatus}
                            onChange={(e) => setConfig({ ...config, includeNullStatus: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <label className="text-xs text-gray-600">Include NULL/Missing</label>
                        </div>
                        <div className="flex gap-2">
                          {['1', '2', '3', '0'].map(val => (
                            <label key={val} className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={config.statusValues.includes(val)}
                                onChange={(e) => {
                                  const newValues = e.target.checked
                                    ? [...config.statusValues, val]
                                    : config.statusValues.filter(v => v !== val);
                                  setConfig({ ...config, statusValues: newValues.length > 0 ? newValues : ['1'] });
                                }}
                                className="w-3 h-3"
                              />
                              <span className="text-xs">{val}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Custom Filters */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">Custom Filters</label>
                      <button
                        type="button"
                        onClick={addCustomFilter}
                        className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        + Add Filter
                      </button>
                    </div>
                    {config.customFilters.length > 0 && (
                      <div className="space-y-2">
                        {config.customFilters.map((filter, index) => (
                          <div key={index} className="flex gap-2 items-center bg-white p-2 rounded">
                            <input
                              type="text"
                              value={filter.field}
                              onChange={(e) => updateCustomFilter(index, 'field', e.target.value)}
                              placeholder="field"
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs font-mono"
                            />
                            <select
                              value={filter.operator}
                              onChange={(e) => updateCustomFilter(index, 'operator', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                            >
                              <option value="$eq">=</option>
                              <option value="$ne">!=</option>
                              <option value="$in">IN</option>
                            </select>
                            <input
                              type="text"
                              value={filter.value}
                              onChange={(e) => updateCustomFilter(index, 'value', e.target.value)}
                              placeholder="value"
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => removeCustomFilter(index)}
                              className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Filter Mappings */}
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">Filter Mapping</label>
                      <button
                        type="button"
                        onClick={addFilterMapping}
                        className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        + Add Mapping
                      </button>
                    </div>
                    {config.filterMappings.length > 0 ? (
                      <div className="space-y-2">
                        {config.filterMappings.map((mapping, index) => (
                          <div key={index} className="flex gap-2 items-center bg-white p-2 rounded">
                            <input
                              type="text"
                              value={mapping.key}
                              onChange={(e) => updateFilterMapping(index, 'key', e.target.value)}
                              placeholder="key"
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs font-mono"
                            />
                            <span className="text-gray-400">→</span>
                            <input
                              type="text"
                              value={mapping.value}
                              onChange={(e) => updateFilterMapping(index, 'value', e.target.value)}
                              placeholder="value"
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => removeFilterMapping(index)}
                              className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 text-center py-2">
                        No filter mappings yet. Click "+ Add Mapping" to add one.
                      </div>
                    )}
                  </div>

                  {/* Generated Preview */}
                  <div className="border-t border-gray-200 pt-4">
                    <label className="text-sm font-semibold text-gray-900 mb-2 block">Generated Configuration</label>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Filters:</p>
                        <div className="bg-gray-900 text-green-400 p-2 rounded overflow-x-auto">
                          <code className="text-xs whitespace-pre">{JSON.stringify(buildFilters(), null, 2)}</code>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Filter Mapping:</p>
                        <div className="bg-gray-900 text-green-400 p-2 rounded overflow-x-auto">
                          <code className="text-xs whitespace-pre">{JSON.stringify(buildFilterMapping(), null, 2)}</code>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Sync Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sync Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={config.syncType}
                      onChange={(e) => setConfig({ ...config, syncType: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base bg-white"
                    >
                      <option value="DITTO">DITTO</option>
                      <option value="CUSTOM">CUSTOM</option>
                    </select>
                  </div>

                  {/* Filters */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filters (JSON)
                    </label>
                    <textarea
                      value={JSON.stringify(buildFilters(), null, 2)}
                      readOnly
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono resize-none bg-gray-50"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Switch to Visual Builder to edit filters
                    </p>
                  </div>

                  {/* Filter Mapping */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter Mapping (JSON)
                    </label>
                    <textarea
                      value={JSON.stringify(buildFilterMapping(), null, 2)}
                      readOnly
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono resize-none bg-gray-50"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Switch to Visual Builder to edit mappings
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!collectionName.trim()}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Next: Configure Collection
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleBack}
                disabled={saving}
                className="px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleSaveAndAdd}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save & Add to Database'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

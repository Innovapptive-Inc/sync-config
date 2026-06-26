'use client';

import { useState, useEffect, useRef } from 'react';

export default function CollectionConfigBuilder({ collection, onChange, onDelete, defaultExpanded = false }) {
  const [mode, setMode] = useState('builder');
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  // Track what we last sent to parent to avoid re-parsing our own changes
  const lastSentCollection = useRef(null);
  
  // Parse collection into structured parts
  const [config, setConfig] = useState({
    syncType: collection.syncType || 'DITTO',
    // Status filter settings
    hasStatusFilter: false,
    statusValues: ['1'],
    includeNullStatus: false,
    // Additional filters
    customFilters: [],
    // Filter mapping
    filterMappings: [],
  });

  const [rawFilters, setRawFilters] = useState(JSON.stringify(collection.filters || {}, null, 2));
  const [rawFilterMapping, setRawFilterMapping] = useState(JSON.stringify(collection.filterMapping || {}, null, 2));

  useEffect(() => {
    // Always keep raw JSON in sync with the collection prop
    setRawFilters(JSON.stringify(collection.filters || {}, null, 2));
    setRawFilterMapping(JSON.stringify(collection.filterMapping || {}, null, 2));

    // Skip re-parsing builder config if this prop update was caused by our own onChange call
    const incomingJson = JSON.stringify(collection);
    if (lastSentCollection.current && lastSentCollection.current === incomingJson) {
      return;
    }
    // External change (e.g., after save/refresh) — re-parse into builder state
    lastSentCollection.current = null;
    parseConfig();
  }, [collection]);

  const parseConfig = () => {
    try {
      const filters = collection.filters || {};
      const filterMapping = collection.filterMapping || {};

      // Parse status filter
      let hasStatus = false;
      let statusVals = ['1'];
      let includeNull = false;

      if (filters.$or) {
        const orCondition = filters.$or;
        includeNull = orCondition.some(c => c.status && c.status.$exists === false);
        const statusCondition = orCondition.find(c => c.status && (c.status.$in || c.status.$numberInt));
        if (statusCondition) {
          hasStatus = true;
          if (statusCondition.status.$in) {
            statusVals = statusCondition.status.$in.map(v => String(v));
          }
        }
      } else if (filters.status) {
        hasStatus = true;
        if (filters.status.$in) {
          statusVals = filters.status.$in.map(v => String(v));
        }
      }

      // Parse custom filters (any filter key that isn't status or $or)
      const customFilters = [];
      Object.entries(filters).forEach(([key, val]) => {
        if (key === 'status' || key === '$or') return;
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          const operator = Object.keys(val)[0] || '$eq';
          const value = val[operator];
          customFilters.push({ field: key, operator, value: String(value) });
        } else {
          customFilters.push({ field: key, operator: '$eq', value: String(val) });
        }
      });

      // Parse filter mappings
      const mappings = Object.entries(filterMapping).map(([key, value]) => ({
        key,
        value: String(value),
      }));

      setConfig({
        syncType: collection.syncType || 'DITTO',
        hasStatusFilter: hasStatus,
        statusValues: statusVals,
        includeNullStatus: includeNull,
        customFilters,
        filterMappings: mappings,
      });
    } catch (err) {
      console.error('Parse error:', err);
    }
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

    // Add custom filters
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

  const handleConfigChange = (field, value) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    applyChanges(newConfig);
  };

  const buildFiltersFromConfig = (cfg) => {
    const filters = {};

    if (cfg.hasStatusFilter) {
      if (cfg.includeNullStatus) {
        filters.$or = [
          { status: { $exists: false } },
          { status: { $in: cfg.statusValues.map(v => v === '1' || v === '2' ? parseInt(v) : v) } },
        ];
      } else {
        filters.status = {
          $in: cfg.statusValues.map(v => v === '1' || v === '2' ? parseInt(v) : v),
        };
      }
    }

    // Add custom filters
    cfg.customFilters.forEach(filter => {
      if (filter.field && filter.value) {
        filters[filter.field] = { [filter.operator || '$eq']: filter.value };
      }
    });

    return filters;
  };

  const buildFilterMappingFromConfig = (cfg) => {
    const mapping = {};
    cfg.filterMappings.forEach(m => {
      if (m.key && m.value) {
        mapping[m.key] = m.value;
      }
    });
    return mapping;
  };

  const applyChanges = (newConfig = config) => {
    const updatedCollection = {
      ...collection,
      syncType: newConfig.syncType,
      filters: buildFiltersFromConfig(newConfig),
      filterMapping: buildFilterMappingFromConfig(newConfig),
    };
    lastSentCollection.current = JSON.stringify(updatedCollection);
    onChange(updatedCollection);
  };

  const handleRawFiltersChange = (value) => {
    setRawFilters(value);
    try {
      const parsed = JSON.parse(value);
      const updatedCollection = { ...collection, filters: parsed };
      lastSentCollection.current = JSON.stringify(updatedCollection);
      onChange(updatedCollection);
    } catch (e) {
      // Invalid JSON, wait for valid input
    }
  };

  const handleRawFilterMappingChange = (value) => {
    setRawFilterMapping(value);
    try {
      const parsed = JSON.parse(value);
      const updatedCollection = { ...collection, filterMapping: parsed };
      lastSentCollection.current = JSON.stringify(updatedCollection);
      onChange(updatedCollection);
    } catch (e) {
      // Invalid JSON, wait for valid input
    }
  };

  const addCustomFilter = () => {
    const newFilters = [...config.customFilters, { field: '', operator: '$eq', value: '' }];
    setConfig({ ...config, customFilters: newFilters });
    applyChanges({ ...config, customFilters: newFilters });
  };

  const removeCustomFilter = (index) => {
    const newFilters = config.customFilters.filter((_, i) => i !== index);
    setConfig({ ...config, customFilters: newFilters });
    applyChanges({ ...config, customFilters: newFilters });
  };

  const updateCustomFilter = (index, field, value) => {
    const newFilters = [...config.customFilters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    handleConfigChange('customFilters', newFilters);
  };

  const addFilterMapping = () => {
    const newMappings = [...config.filterMappings, { key: '', value: '' }];
    setConfig({ ...config, filterMappings: newMappings });
    applyChanges({ ...config, filterMappings: newMappings });
  };

  const removeFilterMapping = (index) => {
    const newMappings = config.filterMappings.filter((_, i) => i !== index);
    setConfig({ ...config, filterMappings: newMappings });
    applyChanges({ ...config, filterMappings: newMappings });
  };

  const updateFilterMapping = (index, field, value) => {
    const newMappings = [...config.filterMappings];
    newMappings[index] = { ...newMappings[index], [field]: value };
    handleConfigChange('filterMappings', newMappings);
  };

  return (
    <div className="border border-gray-200 rounded-lg hover:border-blue-300 transition-colors bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h4 className="font-semibold text-gray-900 text-lg">{collection.name}</h4>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
              {collection.syncType || 'DITTO'}
            </span>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {isExpanded ? '▼ Collapse' : '▶ Expand'}
            </button>
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="px-3 py-1 text-sm text-red-600 hover:text-white hover:bg-red-600 border border-red-600 rounded transition-colors"
          >
            Delete
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('builder')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'builder'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
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
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            📝 Raw JSON
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4">
          {/* Collection Name - Read-only */}
          <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Collection Name (Read-only)
            </label>
            <div className="text-sm font-semibold text-gray-900">{collection.name}</div>
            <p className="text-xs text-gray-500 mt-1">Collection name cannot be changed after creation</p>
          </div>

          {mode === 'builder' ? (
            <div className="space-y-4">
              {/* Sync Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sync Type
                </label>
                <select
                  value={config.syncType}
                  onChange={(e) => handleConfigChange('syncType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="DITTO">DITTO</option>
                  <option value="CUSTOM">CUSTOM</option>
                </select>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h5 className="text-sm font-semibold text-gray-900 mb-3">Filters</h5>

                {/* Status Filter */}
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <input
                      type="checkbox"
                      checked={config.hasStatusFilter}
                      onChange={(e) => handleConfigChange('hasStatusFilter', e.target.checked)}
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
                          onChange={(e) => handleConfigChange('includeNullStatus', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <label className="text-xs text-gray-600">Include NULL/Missing status</label>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Status Values:</label>
                        <div className="flex gap-2 flex-wrap">
                          {['1', '2', '3', '0', 'ACTIVE', 'IN_ACTIVE', 'DELETED'].map(val => (
                            <label key={val} className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={config.statusValues.includes(val)}
                                onChange={(e) => {
                                  const newValues = e.target.checked
                                    ? [...config.statusValues, val]
                                    : config.statusValues.filter(v => v !== val);
                                  handleConfigChange('statusValues', newValues.length > 0 ? newValues : ['1']);
                                }}
                                className="w-3 h-3 text-blue-600 rounded"
                              />
                              <span className="text-xs">{val}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom Filters */}
                <div className="bg-blue-50 rounded-lg p-3 mb-3">
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
                            placeholder="field name"
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs font-mono"
                          />
                          <select
                            value={filter.operator || '$eq'}
                            onChange={(e) => updateCustomFilter(index, 'operator', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                          >
                            <option value="$eq">=</option>
                            <option value="$ne">!=</option>
                            <option value="$gt">{'>'}</option>
                            <option value="$lt">{'<'}</option>
                            <option value="$gte">{'≥'}</option>
                            <option value="$lte">{'≤'}</option>
                            <option value="$in">IN</option>
                            <option value="$exists">EXISTS</option>
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
              </div>

              {/* Filter Mapping */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-semibold text-gray-900">Filter Mapping</h5>
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
                      <div key={index} className="flex gap-2 items-center bg-gray-50 p-2 rounded">
                        <input
                          type="text"
                          value={mapping.key}
                          onChange={(e) => updateFilterMapping(index, 'key', e.target.value)}
                          placeholder="key (e.g., plantId)"
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs font-mono bg-white"
                        />
                        <span className="text-gray-400">→</span>
                        <input
                          type="text"
                          value={mapping.value}
                          onChange={(e) => updateFilterMapping(index, 'value', e.target.value)}
                          placeholder="value (e.g., plant)"
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs font-mono bg-white"
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
                  <div className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded">
                    No filter mappings. Click "+ Add Mapping" to add one.
                  </div>
                )}
              </div>

              {/* Generated Config Preview */}
              <div className="border-t border-gray-200 pt-4">
                <label className="text-sm font-semibold text-gray-900 mb-2 block">
                  Generated Configuration
                </label>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Filters:</p>
                    <div className="bg-gray-900 text-green-400 p-2 rounded overflow-x-auto">
                      <code className="text-xs whitespace-pre">
                        {JSON.stringify(buildFilters(), null, 2)}
                      </code>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Filter Mapping:</p>
                    <div className="bg-gray-900 text-green-400 p-2 rounded overflow-x-auto">
                      <code className="text-xs whitespace-pre">
                        {JSON.stringify(buildFilterMapping(), null, 2)}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Raw JSON Mode */
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Sync Type
                </label>
                <select
                  value={collection.syncType || 'DITTO'}
                  onChange={(e) => onChange({ ...collection, syncType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                >
                  <option value="DITTO">DITTO</option>
                  <option value="CUSTOM">CUSTOM</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Filters (JSON)
                </label>
                <textarea
                  value={rawFilters}
                  onChange={(e) => handleRawFiltersChange(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-xs font-mono resize-none bg-gray-50"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Filter Mapping (JSON)
                </label>
                <textarea
                  value={rawFilterMapping}
                  onChange={(e) => handleRawFilterMappingChange(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-xs font-mono resize-none bg-gray-50"
                />
              </div>

              <p className="text-xs text-gray-500">
                💡 Switch to Visual Builder for easier editing
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

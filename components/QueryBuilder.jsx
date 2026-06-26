'use client';

import { useState, useEffect } from 'react';

export default function QueryBuilder({ collectionName, query, onChange, onDelete, defaultExpanded = false }) {
  const [mode, setMode] = useState('builder'); // 'builder' or 'raw'
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  // Parse query into structured parts
  const [config, setConfig] = useState({
    collection: collectionName,
    selectFields: '*',
    statusFilter: true,
    statusValues: ['1'],
    includeNullStatus: false,
    customFilters: [],
    plantFilter: true,
    updatedAtFilter: true,
    useCommonSuffix: true,
    customSuffix: '',
    orderBy: '_id',
    orderDirection: 'ASC',
  });

  const [rawQuery, setRawQuery] = useState(query);

  // Parse existing query on mount
  useEffect(() => {
    parseQuery(query);
  }, []);

  const parseQuery = (queryString) => {
    try {
      const parsed = {
        collection: collectionName,
        selectFields: '*',
        statusFilter: queryString.includes('status'),
        statusValues: ['1'],
        includeNullStatus: queryString.includes('status IS MISSING'),
        customFilters: [],
        plantFilter: queryString.includes('plant IS MISSING'),
        updatedAtFilter: queryString.includes('updatedAt'),
        useCommonSuffix: queryString.includes("source != 'mobile'"),
        customSuffix: '',
        orderBy: '_id',
        orderDirection: 'ASC',
      };

      // Extract SELECT fields
      const selectMatch = queryString.match(/SELECT\s+(.+?)\s+FROM/i);
      if (selectMatch) {
        parsed.selectFields = selectMatch[1].trim();
      }

      // Extract ORDER BY
      const orderMatch = queryString.match(/ORDER BY\s+(\S+)(\s+(ASC|DESC))?/i);
      if (orderMatch) {
        parsed.orderBy = orderMatch[1];
        parsed.orderDirection = orderMatch[3] || '';
      }

      setConfig(parsed);
      setRawQuery(queryString);
    } catch (err) {
      console.error('Parse error:', err);
      setRawQuery(queryString);
    }
  };

  const generateQuery = () => {
    const parts = [];
    
    // SELECT
    parts.push(`SELECT ${config.selectFields} FROM \`${config.collection}\``);
    
    // WHERE clause
    const conditions = [];

    // Status filter
    if (config.statusFilter) {
      if (config.includeNullStatus) {
        const statusCondition = config.statusValues.length > 1
          ? `status.\`$numberInt\` IN (${config.statusValues.map(v => `'${v}'`).join(', ')})`
          : `status.\`$numberInt\` = '${config.statusValues[0]}'`;
        conditions.push(`(status IS MISSING OR ${statusCondition})`);
      } else {
        if (config.statusValues.length > 1) {
          conditions.push(`(status.\`$numberInt\` IN (${config.statusValues.map(v => `'${v}'`).join(', ')}))`);
        } else {
          conditions.push(`(status.\`$numberInt\` = '${config.statusValues[0]}')`);
        }
      }
    }

    // UpdatedAt filter
    if (config.updatedAtFilter) {
      conditions.push(
        `(((updatedAt.\`$date\`.\`$numberLong\` IS NOT MISSING) AND (updatedAt.\`$date\`.\`$numberLong\` >= :since)))`
      );
    }

    // Plant filter
    if (config.plantFilter) {
      conditions.push(
        `(plant IS MISSING OR plant IS NULL OR plant.\`$oid\` = :plantId)`
      );
    }

    // Custom filters
    config.customFilters.forEach(filter => {
      if (filter.field && filter.value) {
        const operator = filter.operator || '=';
        if (operator === 'IN') {
          conditions.push(`(${filter.field} IN (${filter.value.split(',').map(v => `'${v.trim()}'`).join(', ')}))`);
        } else {
          conditions.push(`(${filter.field} ${operator} '${filter.value}')`);
        }
      }
    });

    if (conditions.length > 0) {
      parts.push('WHERE ' + conditions.join(' AND '));
    }

    // Common suffix (source and device filter)
    if (config.useCommonSuffix) {
      parts.push(
        `AND ((source != 'mobile') OR (device != :deviceId AND source = 'mobile') OR (device = :deviceId AND updatedAt.\`$date\`.\`$numberLong\` <= '<signIn Time>'))`
      );
    } else if (config.customSuffix) {
      parts.push(`AND ${config.customSuffix}`);
    }

    // ORDER BY
    if (config.orderBy) {
      if (config.orderDirection) {
        parts.push(`ORDER BY ${config.orderBy} ${config.orderDirection}`);
      } else {
        parts.push(`ORDER BY ${config.orderBy}`);
      }
    }

    return parts.join(' ');
  };

  const handleConfigChange = (field, value) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    
    const newQuery = generateQuery();
    setRawQuery(newQuery);
    onChange(newQuery);
  };

  const handleArrayChange = (field, index, value) => {
    const newArray = [...config[field]];
    newArray[index] = value;
    handleConfigChange(field, newArray);
  };

  const addCustomFilter = () => {
    const newFilters = [...config.customFilters, { field: '', operator: '=', value: '' }];
    handleConfigChange('customFilters', newFilters);
  };

  const removeCustomFilter = (index) => {
    const newFilters = config.customFilters.filter((_, i) => i !== index);
    handleConfigChange('customFilters', newFilters);
  };

  const handleRawQueryChange = (value) => {
    setRawQuery(value);
    onChange(value);
  };

  const applyGeneratedQuery = () => {
    const generated = generateQuery();
    setRawQuery(generated);
    onChange(generated);
  };

  return (
    <div className="border border-gray-200 rounded-lg hover:border-blue-300 transition-colors bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h4 className="font-semibold text-gray-900 text-lg">{collectionName}</h4>
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
            title="Delete this subscription"
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
            📝 Raw Query
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
            <div className="text-sm font-semibold text-gray-900">{collectionName}</div>
            <p className="text-xs text-gray-500 mt-1">Collection name cannot be changed after creation</p>
          </div>

          {mode === 'builder' ? (
          <div className="space-y-4">
            {/* SELECT Fields */}
            <div className="grid grid-cols-12 gap-3 items-center">
              <label className="col-span-3 text-sm font-medium text-gray-700">
                SELECT
              </label>
              <input
                type="text"
                value={config.selectFields}
                onChange={(e) => handleConfigChange('selectFields', e.target.value)}
                className="col-span-9 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                placeholder="* or field1, field2, field3"
              />
            </div>

            {/* Collection Name (read-only) */}
            <div className="grid grid-cols-12 gap-3 items-center">
              <label className="col-span-3 text-sm font-medium text-gray-700">
                FROM
              </label>
              <input
                type="text"
                value={config.collection}
                readOnly
                className="col-span-9 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm font-mono text-gray-600"
              />
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h5 className="text-sm font-semibold text-gray-900 mb-3">WHERE Conditions</h5>

              {/* Status Filter */}
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    checked={config.statusFilter}
                    onChange={(e) => handleConfigChange('statusFilter', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Status Filter
                  </label>
                </div>

                {config.statusFilter && isExpanded && (
                  <div className="ml-7 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.includeNullStatus}
                        onChange={(e) => handleConfigChange('includeNullStatus', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <label className="text-xs text-gray-600">
                        Include NULL/Missing status
                      </label>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Status Values:</label>
                      <div className="flex gap-2 flex-wrap">
                        {['1', '2', '3', '0'].map(val => (
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

              {/* UpdatedAt Filter */}
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.updatedAtFilter}
                    onChange={(e) => handleConfigChange('updatedAtFilter', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    UpdatedAt Filter (Delta Sync)
                  </label>
                  <span className="text-xs text-gray-500 ml-auto">
                    updatedAt ≥ :since
                  </span>
                </div>
              </div>

              {/* Plant Filter */}
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.plantFilter}
                    onChange={(e) => handleConfigChange('plantFilter', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Plant Filter
                  </label>
                  <span className="text-xs text-gray-500 ml-auto">
                    plant = :plantId OR NULL
                  </span>
                </div>
              </div>

              {/* Custom Filters */}
              {isExpanded && (
                <div className="bg-blue-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Custom Filters
                    </label>
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
                        <div key={index} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={filter.field}
                            onChange={(e) => {
                              const newFilters = [...config.customFilters];
                              newFilters[index].field = e.target.value;
                              handleConfigChange('customFilters', newFilters);
                            }}
                            placeholder="field name"
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs font-mono"
                          />
                          <select
                            value={filter.operator || '='}
                            onChange={(e) => {
                              const newFilters = [...config.customFilters];
                              newFilters[index].operator = e.target.value;
                              handleConfigChange('customFilters', newFilters);
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                          >
                            <option value="=">=</option>
                            <option value="!=">!=</option>
                            <option value=">">{'>'}</option>
                            <option value="<">{'<'}</option>
                            <option value=">=">{'≥'}</option>
                            <option value="<=">{'≤'}</option>
                            <option value="IN">IN</option>
                            <option value="LIKE">LIKE</option>
                          </select>
                          <input
                            type="text"
                            value={filter.value}
                            onChange={(e) => {
                              const newFilters = [...config.customFilters];
                              newFilters[index].value = e.target.value;
                              handleConfigChange('customFilters', newFilters);
                            }}
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
              )}
            </div>

            {/* Common Suffix (Source & Device Filter) */}
            <div className="border-t border-gray-200 pt-4">
              <div className="bg-green-50 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    checked={config.useCommonSuffix}
                    onChange={(e) => handleConfigChange('useCommonSuffix', e.target.checked)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Use Common Suffix (Source & Device Filter)
                  </label>
                  <span className="ml-auto px-2 py-1 bg-green-600 text-white text-xs rounded">
                    RECOMMENDED
                  </span>
                </div>
                {config.useCommonSuffix && isExpanded && (
                  <div className="ml-7 mt-2 p-2 bg-white rounded border border-green-200">
                    <code className="text-xs text-gray-600 break-all">
                      ((source != 'mobile') OR (device != :deviceId AND source = 'mobile') OR (device = :deviceId AND updatedAt ≤ signInTime))
                    </code>
                  </div>
                )}
              </div>

              {!config.useCommonSuffix && isExpanded && (
                <div className="bg-yellow-50 rounded-lg p-3 mb-3">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Custom Suffix (Advanced)
                  </label>
                  <textarea
                    value={config.customSuffix}
                    onChange={(e) => handleConfigChange('customSuffix', e.target.value)}
                    rows={2}
                    placeholder="Custom WHERE conditions..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs font-mono"
                  />
                </div>
              )}
            </div>

            {/* ORDER BY */}
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-12 gap-3 items-center">
                <label className="col-span-3 text-sm font-medium text-gray-700">
                  ORDER BY
                </label>
                <input
                  type="text"
                  value={config.orderBy}
                  onChange={(e) => handleConfigChange('orderBy', e.target.value)}
                  className="col-span-6 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                  placeholder="_id"
                />
                <select
                  value={config.orderDirection}
                  onChange={(e) => handleConfigChange('orderDirection', e.target.value)}
                  className="col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="">None</option>
                  <option value="ASC">ASC ↑</option>
                  <option value="DESC">DESC ↓</option>
                </select>
              </div>
            </div>

            {/* Generated Query Preview */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-900">
                  Generated Query
                </label>
                <button
                  type="button"
                  onClick={applyGeneratedQuery}
                  className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Apply Generated Query
                </button>
              </div>
              <div className="bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto">
                <code className="text-xs break-all whitespace-pre-wrap">
                  {generateQuery()}
                </code>
              </div>
            </div>
          </div>
        ) : (
          /* Raw Query Editor */
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              N1QL Query (Raw)
            </label>
            <textarea
              value={rawQuery}
              onChange={(e) => handleRawQueryChange(e.target.value)}
              rows={isExpanded ? 10 : 5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono resize-none bg-gray-50"
              placeholder="SELECT * FROM ..."
            />
            <p className="text-xs text-gray-500">
              💡 Switch to Visual Builder for easier editing, or manually edit the query here
            </p>
          </div>
        )}
        </div>
      )}
    </div>
  );
}

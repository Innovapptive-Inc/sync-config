'use client';

import { useState } from 'react';

export default function AddCollectionDialog({ isOpen, onClose, onAdd, type, onSave, saving }) {
  const [collectionName, setCollectionName] = useState('');
  const [step, setStep] = useState(1); // 1: name, 2: query builder
  
  // Query builder state
  const [config, setConfig] = useState({
    selectFields: '*',
    statusFilter: true,
    statusValues: ['1'],
    includeNullStatus: false,
    customFilters: [],
    plantFilter: true,
    updatedAtFilter: true,
    useCommonSuffix: true,
    orderBy: '_id',
    orderDirection: 'ASC',
  });

  if (!isOpen) return null;

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
    setConfig({
      selectFields: '*',
      statusFilter: true,
      statusValues: ['1'],
      includeNullStatus: false,
      customFilters: [],
      plantFilter: true,
      updatedAtFilter: true,
      useCommonSuffix: true,
      orderBy: '_id',
      orderDirection: 'ASC',
    });
    onClose();
  };

  const generateQuery = () => {
    const parts = [];
    parts.push(`SELECT ${config.selectFields} FROM \`${collectionName}\``);
    
    const conditions = [];
    
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
    
    if (config.updatedAtFilter) {
      conditions.push(`(((updatedAt.\`$date\`.\`$numberLong\` IS NOT MISSING) AND (updatedAt.\`$date\`.\`$numberLong\` >= :since)))`);
    }
    
    if (config.plantFilter) {
      conditions.push(`(plant IS MISSING OR plant IS NULL OR plant.\`$oid\` = :plantId)`);
    }
    
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
    
    if (config.useCommonSuffix) {
      parts.push(`AND ((source != 'mobile') OR (device != :deviceId AND source = 'mobile') OR (device = :deviceId AND updatedAt.\`$date\`.\`$numberLong\` <= '<signIn Time>'))`);
    }
    
    if (config.orderBy) {
      if (config.orderDirection) {
        parts.push(`ORDER BY ${config.orderBy} ${config.orderDirection}`);
      } else {
        parts.push(`ORDER BY ${config.orderBy}`);
      }
    }
    return parts.join(' ');
  };

  const handleSaveAndAdd = async () => {
    const query = generateQuery();
    const newCollection = {
      collectionName: collectionName.trim(),
      query: query,
    };
    
    // Pass the collection to parent which will handle saving
    await onAdd(newCollection);
    
    // Close and reset only after successful save
    handleCancel();
  };

  const addCustomFilter = () => {
    setConfig({
      ...config,
      customFilters: [...config.customFilters, { field: '', operator: '=', value: '' }],
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8 transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Add New Subscription Collection
              </h3>
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
            /* Step 1: Collection Name */
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
            /* Step 2: Query Builder */
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-900">
                  <strong>Collection:</strong> {collectionName}
                </p>
              </div>

              {/* SELECT */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SELECT</label>
                <input
                  type="text"
                  value={config.selectFields}
                  onChange={(e) => setConfig({ ...config, selectFields: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                  placeholder="*"
                />
              </div>

              {/* Status Filter */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    checked={config.statusFilter}
                    onChange={(e) => setConfig({ ...config, statusFilter: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">Status Filter</label>
                </div>
                {config.statusFilter && (
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

              {/* UpdatedAt Filter */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.updatedAtFilter}
                    onChange={(e) => setConfig({ ...config, updatedAtFilter: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">UpdatedAt Filter (Delta Sync)</label>
                </div>
              </div>

              {/* Plant Filter */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.plantFilter}
                    onChange={(e) => setConfig({ ...config, plantFilter: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">Plant Filter</label>
                </div>
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
                      <div key={index} className="flex gap-2 items-center">
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
                          <option value="=">=</option>
                          <option value="!=">!=</option>
                          <option value=">">{'>'}</option>
                          <option value="<">{'<'}</option>
                          <option value="IN">IN</option>
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

              {/* Common Suffix */}
              <div className="bg-green-50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.useCommonSuffix}
                    onChange={(e) => setConfig({ ...config, useCommonSuffix: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">Use Common Suffix</label>
                  <span className="ml-auto px-2 py-1 bg-green-600 text-white text-xs rounded">RECOMMENDED</span>
                </div>
              </div>

              {/* ORDER BY */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ORDER BY</label>
                  <input
                    type="text"
                    value={config.orderBy}
                    onChange={(e) => setConfig({ ...config, orderBy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Direction</label>
                  <select
                    value={config.orderDirection}
                    onChange={(e) => setConfig({ ...config, orderDirection: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                  >
                    <option value="">None</option>
                    <option value="ASC">ASC ↑</option>
                    <option value="DESC">DESC ↓</option>
                  </select>
                </div>
              </div>

              {/* Generated Query Preview */}
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Generated Query</label>
                <div className="bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto">
                  <code className="text-xs break-all whitespace-pre-wrap">{generateQuery()}</code>
                </div>
              </div>
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
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Configure Query
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
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

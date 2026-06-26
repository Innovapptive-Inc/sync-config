'use client';

import { useState, useEffect } from 'react';
import ConfirmModal from './ConfirmModal';
import QueryBuilder from './QueryBuilder';
import CollectionConfigBuilder from './CollectionConfigBuilder';
import AddCollectionDialog from './AddCollectionDialog';
import AddBaseCollectionDialog from './AddBaseCollectionDialog';

export default function ConfigForm({ initialData, onSave, saving }) {
  const [activeTab, setActiveTab] = useState('subscriptionCollections');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingData, setPendingData] = useState(null);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [lastSavedData, setLastSavedData] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addDialogType, setAddDialogType] = useState(null);
  
  // State for each section
  const [subscriptionCollections, setSubscriptionCollections] = useState([]);
  const [baseCollections, setBaseCollections] = useState([]);
  const [masterPlantCollections, setMasterPlantCollections] = useState([]);
  const [transactionalCollections, setTransactionalCollections] = useState([]);

  // Initialize state from initialData
  useEffect(() => {
    if (initialData && initialData.config) {
      setLastSavedData(initialData);
      setSubscriptionCollections(initialData.config.subscriptionCollections || []);
      setBaseCollections(initialData.config.base?.collections || []);
      setMasterPlantCollections(initialData.config.master_plant?.collections || []);
      setTransactionalCollections(initialData.config.transactional?.collections || []);
    }
  }, [initialData]);

  // Track changes
  useEffect(() => {
    if (lastSavedData && initialData) {
      const hasChanges = 
        JSON.stringify(subscriptionCollections) !== JSON.stringify(lastSavedData.config.subscriptionCollections) ||
        JSON.stringify(baseCollections) !== JSON.stringify(lastSavedData.config.base?.collections) ||
        JSON.stringify(masterPlantCollections) !== JSON.stringify(lastSavedData.config.master_plant?.collections) ||
        JSON.stringify(transactionalCollections) !== JSON.stringify(lastSavedData.config.transactional?.collections);
      
      setIsDirty(hasChanges);
      setShowUnsavedWarning(hasChanges);
    }
  }, [subscriptionCollections, baseCollections, masterPlantCollections, transactionalCollections, lastSavedData, initialData]);

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const getChanges = () => {
    const changes = [];
    if (isDirty) {
      changes.push({
        field: 'Sync Configuration',
        oldValue: 'Previous configuration',
        newValue: 'Updated configuration with modified collections and queries',
      });
    }
    return changes;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const changes = getChanges();
    if (changes.length === 0) return;

    const updatedConfig = {
      ...initialData.config,
      subscriptionCollections,
      base: {
        ...initialData.config.base,
        collections: baseCollections,
      },
      master_plant: {
        ...initialData.config.master_plant,
        collections: masterPlantCollections,
      },
      transactional: {
        ...initialData.config.transactional,
        collections: transactionalCollections,
      },
    };

    const dataToSave = {
      ...initialData,
      config: updatedConfig,
    };

    setPendingData(dataToSave);
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    if (pendingData) {
      await onSave(pendingData);
      // Don't set lastSavedData here — let the useEffect([initialData]) handle it
      // when the fresh server response arrives via the updated initialData prop
      setPendingData(null);
      setShowConfirmModal(false);
      setIsDirty(false);
    }
  };

  const handleCancelChanges = () => {
    if (lastSavedData && lastSavedData.config) {
      setSubscriptionCollections(lastSavedData.config.subscriptionCollections || []);
      setBaseCollections(lastSavedData.config.base?.collections || []);
      setMasterPlantCollections(lastSavedData.config.master_plant?.collections || []);
      setTransactionalCollections(lastSavedData.config.transactional?.collections || []);
      setIsDirty(false);
    }
  };

  // Subscription Collection Handlers
  const handleSubscriptionQueryChange = (index, newQuery) => {
    const updated = [...subscriptionCollections];
    updated[index] = { ...updated[index], query: newQuery };
    setSubscriptionCollections(updated);
  };

  const handleDeleteSubscription = (index) => {
    if (confirm('Delete this subscription collection?')) {
      setSubscriptionCollections(subscriptionCollections.filter((_, i) => i !== index));
    }
  };

  // Base Collection Handlers
  const handleBaseCollectionChange = (index, newCollection) => {
    const updated = [...baseCollections];
    updated[index] = newCollection;
    setBaseCollections(updated);
  };

  const handleDeleteBaseCollection = (index) => {
    if (confirm('Delete this base collection?')) {
      setBaseCollections(baseCollections.filter((_, i) => i !== index));
    }
  };

  // Master Plant Collection Handlers
  const handleMasterPlantCollectionChange = (index, newCollection) => {
    const updated = [...masterPlantCollections];
    updated[index] = newCollection;
    setMasterPlantCollections(updated);
  };

  const handleDeleteMasterPlantCollection = (index) => {
    if (confirm('Delete this master plant collection?')) {
      setMasterPlantCollections(masterPlantCollections.filter((_, i) => i !== index));
    }
  };

  // Transactional Collection Handlers
  const handleTransactionalCollectionChange = (index, newCollection) => {
    const updated = [...transactionalCollections];
    updated[index] = newCollection;
    setTransactionalCollections(updated);
  };

  const handleDeleteTransactionalCollection = (index) => {
    if (confirm('Delete this transactional collection?')) {
      setTransactionalCollections(transactionalCollections.filter((_, i) => i !== index));
    }
  };

  const openAddDialog = (type) => {
    setAddDialogType(type);
    setShowAddDialog(true);
  };

  const handleAddFromDialog = async (newCollection) => {
    let updatedConfig;
    
    switch (addDialogType) {
      case 'subscription':
        setSubscriptionCollections([newCollection, ...subscriptionCollections]);
        updatedConfig = {
          ...initialData.config,
          subscriptionCollections: [newCollection, ...subscriptionCollections],
        };
        break;
      case 'base':
        setBaseCollections([newCollection, ...baseCollections]);
        updatedConfig = {
          ...initialData.config,
          base: {
            ...initialData.config.base,
            collections: [newCollection, ...baseCollections],
          },
        };
        break;
      case 'masterPlant':
        setMasterPlantCollections([newCollection, ...masterPlantCollections]);
        updatedConfig = {
          ...initialData.config,
          master_plant: {
            ...initialData.config.master_plant,
            collections: [newCollection, ...masterPlantCollections],
          },
        };
        break;
      case 'transactional':
        setTransactionalCollections([newCollection, ...transactionalCollections]);
        updatedConfig = {
          ...initialData.config,
          transactional: {
            ...initialData.config.transactional,
            collections: [newCollection, ...transactionalCollections],
          },
        };
        break;
      default:
        return;
    }

    const dataToSave = {
      ...initialData,
      config: updatedConfig,
    };

    await onSave(dataToSave);
    setLastSavedData(dataToSave);
  };

  // Filter collections based on search
  const filterCollections = (collections, nameKey = 'collectionName') => {
    if (!searchQuery.trim()) return collections;
    return collections.filter(col =>
      col[nameKey]?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredSubscriptions = filterCollections(subscriptionCollections, 'collectionName');
  const filteredBase = filterCollections(baseCollections, 'name');
  const filteredMasterPlant = filterCollections(masterPlantCollections, 'name');
  const filteredTransactional = filterCollections(transactionalCollections, 'name');

  const changes = getChanges();

  const tabs = [
    { id: 'subscriptionCollections', label: 'Subscription Queries', count: subscriptionCollections.length },
    { id: 'base', label: 'Base Collections', count: baseCollections.length },
    { id: 'masterPlant', label: 'Master Plant', count: masterPlantCollections.length },
    { id: 'transactional', label: 'Transactional', count: transactionalCollections.length },
  ];

  return (
    <>
      {/* Unsaved Changes Warning */}
      {showUnsavedWarning && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <svg className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-yellow-800">You have unsaved changes</h4>
            <p className="text-sm text-yellow-700 mt-1">Don't forget to save your changes before leaving.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md">
        {/* Tabs */}
        <div className="border-b border-gray-200 px-6 pt-6">
          <div className="flex space-x-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Subscription Collections Tab */}
          {activeTab === 'subscriptionCollections' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Subscription Queries</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    N1QL/SQL++ queries for real-time data subscriptions ({subscriptionCollections.length} collections)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openAddDialog('subscription')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm font-medium whitespace-nowrap"
                >
                  + Add Subscription
                </button>
              </div>

              {/* Search Box */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search collections by name..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Results info */}
              {searchQuery && (
                <div className="text-sm text-gray-600">
                  Showing {filteredSubscriptions.length} of {subscriptionCollections.length} collections
                </div>
              )}

              <div className="space-y-4">
                {filteredSubscriptions.length > 0 ? (
                  filteredSubscriptions.map((sub, index) => {
                    const originalIndex = subscriptionCollections.findIndex(s => s.collectionName === sub.collectionName);
                    return (
                      <QueryBuilder
                        key={originalIndex}
                        collectionName={sub.collectionName}
                        query={sub.query}
                        onChange={(newQuery) => handleSubscriptionQueryChange(originalIndex, newQuery)}
                        onDelete={() => handleDeleteSubscription(originalIndex)}
                        defaultExpanded={false}
                      />
                    );
                  })
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">No collections found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Base Collections Tab */}
          {activeTab === 'base' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Base Collections</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Core system collections ({baseCollections.length} collections)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openAddDialog('base')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm font-medium whitespace-nowrap"
                >
                  + Add Collection
                </button>
              </div>

              {/* Search Box */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search collections by name..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {searchQuery && (
                <div className="text-sm text-gray-600">
                  Showing {filteredBase.length} of {baseCollections.length} collections
                </div>
              )}

              <div className="space-y-3">
                {filteredBase.length > 0 ? (
                  filteredBase.map((collection, index) => {
                    const originalIndex = baseCollections.findIndex(c => c.name === collection.name);
                    return (
                      <CollectionConfigBuilder
                        key={originalIndex}
                        collection={collection}
                        onChange={(newCollection) => handleBaseCollectionChange(originalIndex, newCollection)}
                        onDelete={() => handleDeleteBaseCollection(originalIndex)}
                        defaultExpanded={false}
                      />
                    );
                  })
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">No collections found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Master Plant Collections Tab */}
          {activeTab === 'masterPlant' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Master Plant Collections</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Plant-specific master data ({masterPlantCollections.length} collections)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openAddDialog('masterPlant')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm font-medium whitespace-nowrap"
                >
                  + Add Collection
                </button>
              </div>

              {/* Search Box */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search collections by name..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {searchQuery && (
                <div className="text-sm text-gray-600">
                  Showing {filteredMasterPlant.length} of {masterPlantCollections.length} collections
                </div>
              )}

              <div className="space-y-3">
                {filteredMasterPlant.length > 0 ? (
                  filteredMasterPlant.map((collection, index) => {
                    const originalIndex = masterPlantCollections.findIndex(c => c.name === collection.name);
                    return (
                      <CollectionConfigBuilder
                        key={originalIndex}
                        collection={collection}
                        onChange={(newCollection) => handleMasterPlantCollectionChange(originalIndex, newCollection)}
                        onDelete={() => handleDeleteMasterPlantCollection(originalIndex)}
                        defaultExpanded={false}
                      />
                    );
                  })
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">No collections found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transactional Collections Tab */}
          {activeTab === 'transactional' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Transactional Collections</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Transaction data collections ({transactionalCollections.length} collections)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openAddDialog('transactional')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm font-medium whitespace-nowrap"
                >
                  + Add Collection
                </button>
              </div>

              {/* Search Box */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search collections by name..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {searchQuery && (
                <div className="text-sm text-gray-600">
                  Showing {filteredTransactional.length} of {transactionalCollections.length} collections
                </div>
              )}

              <div className="space-y-3">
                {filteredTransactional.length > 0 ? (
                  filteredTransactional.map((collection, index) => {
                    const originalIndex = transactionalCollections.findIndex(c => c.name === collection.name);
                    return (
                      <CollectionConfigBuilder
                        key={originalIndex}
                        collection={collection}
                        onChange={(newCollection) => handleTransactionalCollectionChange(originalIndex, newCollection)}
                        onDelete={() => handleDeleteTransactionalCollection(originalIndex)}
                        defaultExpanded={false}
                      />
                    );
                  })
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">No collections found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div className="px-6 pb-6 border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {initialData?.createdAt && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Created
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(initialData.createdAt).toLocaleString()}
                </p>
              </div>
            )}
            {initialData?.updatedAt && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Last Updated
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(initialData.updatedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white px-6 pb-6 border-t border-gray-200 pt-4 flex gap-4">
          <button
            type="button"
            onClick={handleCancelChanges}
            disabled={!isDirty || saving}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel Changes
          </button>
          <button
            type="submit"
            disabled={!isDirty || saving}
            className="flex-1 px-6 py-3 bg-blue-600 border border-transparent rounded-lg text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Configuration'
            )}
          </button>
        </div>
      </form>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSave}
        changes={changes}
        loading={saving}
      />

      {/* Add Collection Dialogs */}
      {addDialogType === 'subscription' && (
        <AddCollectionDialog
          isOpen={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          onAdd={handleAddFromDialog}
          onSave={onSave}
          saving={saving}
        />
      )}
      
      {(addDialogType === 'base' || addDialogType === 'masterPlant' || addDialogType === 'transactional') && (
        <AddBaseCollectionDialog
          isOpen={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          onAdd={handleAddFromDialog}
          type={addDialogType}
          saving={saving}
        />
      )}
    </>
  );
}

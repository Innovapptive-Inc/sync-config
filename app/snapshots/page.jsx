'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SnapshotsPage() {
  const [domain, setDomain] = useState('');
  const [snapshots, setSnapshots] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Bootstrap state
  const [isCascade, setIsCascade] = useState(true);
  const [plantIds, setPlantIds] = useState(['']);
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [bootstrapResult, setBootstrapResult] = useState(null);
  const [bootstrapError, setBootstrapError] = useState(null);

  const handleFetch = async (e) => {
    e.preventDefault();

    if (!domain.trim()) {
      setError('Please enter a domain');
      return;
    }

    setLoading(true);
    setError(null);
    setSnapshots(null);

    try {
      const res = await fetch('/api/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() }),
      });

      const result = await res.json();

      if (!result.success) {
        setError(result.message || 'Failed to fetch snapshots');
        return;
      }

      setSnapshots(result.data);
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  // Bootstrap handlers
  const addPlantId = () => {
    setPlantIds([...plantIds, '']);
  };

  const removePlantId = (index) => {
    if (plantIds.length === 1) return;
    setPlantIds(plantIds.filter((_, i) => i !== index));
  };

  const updatePlantId = (index, value) => {
    const updated = [...plantIds];
    updated[index] = value;
    setPlantIds(updated);
  };

  const handleBootstrap = async (e) => {
    e.preventDefault();

    if (!domain.trim()) {
      setBootstrapError('Please enter a domain above first');
      return;
    }

    const validPlantIds = plantIds.filter((id) => id.trim() !== '');
    if (validPlantIds.length === 0) {
      setBootstrapError('Please add at least one Plant ID');
      return;
    }

    setBootstrapLoading(true);
    setBootstrapError(null);
    setBootstrapResult(null);

    try {
      const res = await fetch('/api/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: domain.trim(),
          isCascade,
          plantIds: validPlantIds,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        setBootstrapError(result.message || 'Failed to trigger bootstrap');
        if (result.data) setBootstrapResult(result.data);
        return;
      }

      setBootstrapResult(result.data);
    } catch (err) {
      setBootstrapError(err.message || 'Network error');
    } finally {
      setBootstrapLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
      case 'running':
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
      case 'queued':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'full':
        return '📦';
      case 'delta':
      case 'incremental':
        return '🔄';
      default:
        return '📋';
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return '—';
    if (typeof duration === 'number') {
      if (duration < 1000) return `${duration}ms`;
      if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
      return `${(duration / 60000).toFixed(1)}m`;
    }
    return String(duration);
  };

  const renderSnapshots = () => {
    if (!snapshots) return null;

    // Handle both array responses and object with items/data array
    const items = Array.isArray(snapshots)
      ? snapshots
      : snapshots.items || snapshots.data || snapshots.snapshots || [];

    if (Array.isArray(items) && items.length === 0) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Snapshots Found</h3>
          <p className="text-gray-500">No snapshot records were returned for this domain.</p>
        </div>
      );
    }

    if (!Array.isArray(items)) {
      // If the response isn't an array, render it as a formatted JSON card
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Response Data</h3>
          </div>
          <div className="p-6">
            <pre className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto text-sm font-mono leading-relaxed">
              {JSON.stringify(snapshots, null, 2)}
            </pre>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Summary bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard
            label="Total Snapshots"
            value={items.length}
            icon="📊"
          />
          <SummaryCard
            label="Completed"
            value={items.filter(s => ['completed', 'success'].includes(s.status?.toLowerCase())).length}
            icon="✅"
          />
          <SummaryCard
            label="In Progress"
            value={items.filter(s => ['in_progress', 'running', 'processing'].includes(s.status?.toLowerCase())).length}
            icon="⏳"
          />
          <SummaryCard
            label="Failed"
            value={items.filter(s => ['failed', 'error'].includes(s.status?.toLowerCase())).length}
            icon="❌"
          />
        </div>

        {/* Snapshot cards */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Snapshot List
            </h3>
            <span className="text-sm text-gray-500">{items.length} record{items.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="divide-y divide-gray-100">
            {items.map((snapshot, index) => (
              <div key={snapshot.eventId || index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg">{getTypeIcon(snapshot.type)}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(snapshot.status)}`}>
                        {snapshot.status || 'Unknown'}
                      </span>
                      {snapshot.type && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                          {snapshot.type}
                        </span>
                      )}
                    </div>

                    {snapshot.eventId && (
                      <p className="text-sm text-gray-600 font-mono truncate mb-2">
                        Event: <span className="text-gray-900">{snapshot.eventId}</span>
                      </p>
                    )}

                    {/* Progress section */}
                    {snapshot.progress && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-4 text-sm">
                          {snapshot.progress.percent != null && (
                            <div className="flex items-center gap-2 flex-1">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(100, snapshot.progress.percent)}%` }}
                                />
                              </div>
                              <span className="text-gray-700 font-medium whitespace-nowrap">
                                {snapshot.progress.percent}%
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {snapshot.progress.totalCount != null && (
                            <span>Total Count: <strong className="text-gray-700">{snapshot.progress.totalCount.toLocaleString()}</strong></span>
                          )}
                          {snapshot.progress.duration != null && (
                            <span>Duration: <strong className="text-gray-700">{formatDuration(snapshot.progress.duration)}</strong></span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Snapshot List</h1>
              <p className="mt-1 text-sm text-gray-500">
                View sync snapshot status and progress
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Config
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Domain input form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <form onSubmit={handleFetch} className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex-1 w-full">
              <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-2">
                Domain
              </label>
              <div className="flex items-center">
                <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  https://
                </span>
                <input
                  id="domain"
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="cwp-merge-qa"
                  className="flex-1 px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-gray-900"
                />
                <span className="inline-flex items-center px-3 py-2 rounded-r-lg border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  .innovapptive.com
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Enter the subdomain (e.g., <code className="bg-gray-100 px-1 rounded">cwp-merge-qa</code>)
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Fetching...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Fetch Snapshots
                </>
              )}
            </button>
          </form>
        </div>

        {/* Bootstrap BASE_MASTER section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-lg">
              <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Bootstrap BASE_MASTER</h2>
              <p className="text-xs text-gray-500">Trigger a base master dump for selected plants</p>
            </div>
          </div>

          <form onSubmit={handleBootstrap} className="space-y-4">
            {/* isCascade checkbox */}
            <div className="flex items-center gap-3">
              <input
                id="isCascade"
                type="checkbox"
                checked={isCascade}
                onChange={(e) => setIsCascade(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isCascade" className="text-sm font-medium text-gray-700">
                isCascade
              </label>
              <span className="text-xs text-gray-400">— cascade the bootstrap to related entities</span>
            </div>

            {/* Plant IDs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plant IDs
              </label>
              <div className="space-y-2">
                {plantIds.map((id, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={id}
                      onChange={(e) => updatePlantId(index, e.target.value)}
                      placeholder="e.g. 693fe5568cb9da3b5ed54ef5"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-gray-900 font-mono"
                    />
                    {plantIds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePlantId(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Remove plant ID"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addPlantId}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Plant ID
              </button>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={bootstrapLoading || !domain.trim()}
                className="inline-flex items-center gap-2 px-6 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {bootstrapLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Triggering...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Trigger Bootstrap
                  </>
                )}
              </button>
              {!domain.trim() && (
                <p className="mt-1.5 text-xs text-amber-600">Enter a domain above to enable this action</p>
              )}
            </div>
          </form>

          {/* Bootstrap error */}
          {bootstrapError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">{bootstrapError}</p>
            </div>
          )}

          {/* Bootstrap result */}
          {bootstrapResult && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-green-100 border-b border-green-200 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-green-800">Bootstrap Triggered</span>
              </div>
              <div className="p-4">
                <pre className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto text-xs font-mono leading-relaxed">
                  {JSON.stringify(bootstrapResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
                  <div className="h-8 bg-gray-200 rounded w-12" />
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-32 mb-4" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="py-4 border-t border-gray-100 first:border-0">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && renderSnapshots()}
      </main>
    </div>
  );
}

function SummaryCard({ label, value, icon }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

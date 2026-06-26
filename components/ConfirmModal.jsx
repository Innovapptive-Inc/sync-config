'use client';

export default function ConfirmModal({ isOpen, onClose, onConfirm, changes, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="ml-3 text-lg font-semibold text-gray-900">
            Confirm Changes
          </h3>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          You're about to update the following information:
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-64 overflow-y-auto">
          {changes && changes.length > 0 ? (
            <dl className="space-y-3">
              {changes.map((change, index) => (
                <div key={index} className="border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                  <dt className="text-xs font-medium text-gray-500 uppercase mb-1">
                    {change.field}
                  </dt>
                  <dd className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 line-through">
                      {change.oldValue || '(empty)'}
                    </span>
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="text-gray-900 font-medium">
                      {change.newValue || '(empty)'}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-gray-500 text-center py-2">
              No changes detected
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Confirm & Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

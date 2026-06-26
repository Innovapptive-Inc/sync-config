'use client';

import { Toaster, toast } from 'react-hot-toast';
import Header from '@/components/Header';
import ConfigForm from '@/components/ConfigForm';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { useRecord } from '@/hooks/useRecord';

export default function Home() {
  const { record, loading, error, saving, updateRecord, retry } = useRecord();

  const handleSave = async (data) => {
    const result = await updateRecord(data, {
      onSuccess: (message) => {
        toast.success(message || 'Configuration saved successfully!', {
          duration: 4000,
          position: 'top-center',
          icon: '✅',
        });
      },
      onError: (errorMsg) => {
        toast.error(errorMsg, {
          duration: 5000,
          position: 'top-center',
        });
      },
    });

    return result;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster />
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unable to Load Configuration
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={retry}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : record ? (
          <ConfigForm initialData={record} onSave={handleSave} saving={saving} />
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Configuration Found
            </h3>
            <p className="text-gray-600">
              No sync configuration with type "syncCollections" found.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

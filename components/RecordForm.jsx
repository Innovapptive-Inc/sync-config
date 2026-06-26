'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import ConfirmModal from './ConfirmModal';

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'Inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
  { value: 'Pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Archived', label: 'Archived', color: 'bg-red-100 text-red-800' },
];

export default function RecordForm({ initialData, onSave, saving }) {
  const { register, handleSubmit, watch, reset, formState: { errors, isDirty } } = useForm({
    defaultValues: initialData || {},
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingData, setPendingData] = useState(null);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [lastSavedData, setLastSavedData] = useState(null);

  const currentValues = watch();

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset(initialData);
      setLastSavedData(initialData);
    }
  }, [initialData, reset]);

  // Warn on unsaved changes before leaving
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

  // Show unsaved warning banner
  useEffect(() => {
    setShowUnsavedWarning(isDirty);
  }, [isDirty]);

  const getChanges = (newData) => {
    const changes = [];
    const fields = ['name', 'email', 'phone', 'status', 'notes'];
    
    fields.forEach((field) => {
      const oldValue = lastSavedData?.[field] || '';
      const newValue = newData[field] || '';
      
      if (oldValue !== newValue) {
        changes.push({
          field: field.charAt(0).toUpperCase() + field.slice(1),
          oldValue: oldValue,
          newValue: newValue,
        });
      }
    });
    
    return changes;
  };

  const onSubmit = (data) => {
    const changes = getChanges(data);
    
    if (changes.length === 0) {
      return; // No changes to save
    }

    setPendingData({ ...data, id: initialData.id });
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    if (pendingData) {
      await onSave(pendingData);
      setLastSavedData(pendingData);
      setPendingData(null);
      setShowConfirmModal(false);
    }
  };

  const handleCancelChanges = () => {
    reset(lastSavedData);
  };

  const changes = pendingData ? getChanges(pendingData) : [];

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

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6 sm:p-8">
        <div className="space-y-6">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              autoFocus
              {...register('name', { required: 'Name is required' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="Enter your full name"
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Please enter a valid email address'
                }
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="your.email@example.com"
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
            )}
            <p className="mt-2 text-sm text-gray-500">We'll use this to contact you</p>
          </div>

          {/* Phone Field */}
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-2">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              {...register('phone')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="(555) 123-4567"
            />
            <p className="mt-2 text-sm text-gray-500">Optional - for quick contact</p>
          </div>

          {/* Status Field */}
          <div>
            <label htmlFor="status" className="block text-sm font-semibold text-gray-900 mb-2">
              Account Status
            </label>
            <select
              id="status"
              {...register('status')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="mt-2 flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                STATUS_OPTIONS.find(opt => opt.value === currentValues.status)?.color || 'bg-gray-100 text-gray-800'
              }`}>
                {currentValues.status}
              </span>
              <span className="text-sm text-gray-500">Current status</span>
            </div>
          </div>

          {/* Notes Field */}
          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-gray-900 mb-2">
              Additional Notes
            </label>
            <textarea
              id="notes"
              rows={5}
              {...register('notes')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base resize-none"
              placeholder="Add any additional information or comments here..."
            />
            <p className="mt-2 text-sm text-gray-500">Optional - any extra details you'd like to record</p>
          </div>
        </div>

        {/* Last Updated Info */}
        {initialData?.lastUpdated && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Last updated: {new Date(initialData.lastUpdated).toLocaleString()}
            </p>
          </div>
        )}

        {/* Action Buttons - Fixed at Bottom */}
        <div className="sticky bottom-0 bg-white pt-6 mt-6 border-t border-gray-200 flex gap-4">
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
              'Save Changes'
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
    </>
  );
}

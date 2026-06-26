'use client';

import { useState, useEffect } from 'react';

export function useRecord() {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fetch record on mount
  useEffect(() => {
    fetchRecord();
  }, []);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/record');
      const result = await response.json();

      if (result.success) {
        setRecord(result.data);
      } else {
        setError(result.message || 'Failed to load record');
      }
    } catch (err) {
      console.error('Error fetching record:', err);
      setError('Unable to load record. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const updateRecord = async (data, options = {}) => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/record', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setRecord(result.data);
        if (options.onSuccess) {
          options.onSuccess(result.message);
        }
        return { success: true, data: result.data };
      } else {
        const errorMsg = result.message || 'Failed to save changes';
        setError(errorMsg);
        if (options.onError) {
          options.onError(errorMsg);
        }
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error('Error updating record:', err);
      const errorMsg = 'Unable to save changes. Please try again.';
      setError(errorMsg);
      if (options.onError) {
        options.onError(errorMsg);
      }
      return { success: false, error: errorMsg };
    } finally {
      setSaving(false);
    }
  };

  const retry = () => {
    fetchRecord();
  };

  return {
    record,
    loading,
    error,
    saving,
    updateRecord,
    retry,
  };
}

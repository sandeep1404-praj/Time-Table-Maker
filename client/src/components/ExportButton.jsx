import React, { useState } from 'react';
import { useExport } from '../hooks/useApi';

export const ExportButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const mutation = useExport();

  const handleExport = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const pdfBlob = await mutation.mutateAsync();
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'academy-timetables.zip');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to export PDFs');
      console.error('Export error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleExport}
        disabled={isLoading}
        className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
      >
        {isLoading ? 'Exporting...' : '📥 Download All PDFs'}
      </button>

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 p-3 rounded">
          ✓ PDFs downloaded successfully!
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded">
          ✗ {error}
        </div>
      )}
    </div>
  );
};

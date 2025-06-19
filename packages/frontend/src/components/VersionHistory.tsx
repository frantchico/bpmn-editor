import React, { useEffect, useState, useCallback } from 'react';
import { modelStorage, ModelVersion } from '@/services/modelStorage';
import toast from 'react-hot-toast'; // Added react-hot-toast

interface VersionHistoryProps {
  processId: string;
  onVersionRestored?: () => void; // Optional callback for when a version is successfully restored
}

const VersionHistory: React.FC<VersionHistoryProps> = ({ processId, onVersionRestored }) => {
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    if (!processId) {
      setVersions([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fetchedVersions = await modelStorage.listVersions(processId);
      // Sort versions in descending order (newest first)
      setVersions(fetchedVersions.sort((a, b) => b.version - a.version));
    } catch (e: any) {
      console.error(`Error fetching versions for process ${processId}:`, e);
      setError(`Failed to load versions: ${e.message || String(e)}`);
      setVersions([]);
    } finally {
      setIsLoading(false);
    }
  }, [processId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleViewVersion = (xml: string) => {
    console.log("Viewing XML for version:", xml);
    // In a real app, you might show this in a modal with syntax highlighting
    toast.success("Version XML has been logged to the console (Press F12 to view).", { duration: 4000 });
  };

  const handleRestoreVersion = async (versionNumber: number) => {
    setIsLoading(true); // Indicate loading state for the restore operation
    setError(null); // Clear previous errors specific to restore
    try {
      const restoredModel = await modelStorage.restoreVersion(processId, versionNumber);
      if (restoredModel) {
        toast.success(`Version ${versionNumber} restored for ${processId}. New version ${restoredModel.version} created.`);
        await fetchVersions(); // Refresh the versions list
        onVersionRestored?.(); // Notify parent component
      } else {
        // This path might not be hit if restoreVersion throws an error on failure
        throw new Error('Failed to restore version - model not found or restore operation returned null.');
      }
    } catch (e: any) {
      console.error(`Error restoring version ${versionNumber} for process ${processId}:`, e);
      const errMessage = `Failed to restore version: ${e.message || String(e)}`;
      setError(errMessage); // Set error state for display within the component if needed
      toast.error(errMessage);
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  if (!processId) {
    return <div className="p-4 text-sm text-gray-600">No Process ID provided.</div>;
  }

  if (isLoading && versions.length === 0) { // Show loading only on initial load
    return <div className="p-4 text-sm text-gray-600">Loading version history...</div>;
  }

  if (error) {
    return <div className="p-4 text-sm text-red-600 bg-red-50 rounded">Error: {error}</div>;
  }

  if (versions.length === 0) {
    return <div className="p-4 text-sm text-gray-600">No versions found for this process.</div>;
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">Version History for {processId}</h3>
      {isLoading && <p className="text-sm text-blue-500 mb-2">Refreshing...</p>}
      <ul className="space-y-2">
        {versions.map((version) => (
          <li key={version.version} className="p-3 bg-white border border-gray-200 rounded-md shadow-sm flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-700">
                Version {version.version}
              </p>
              <p className="text-xs text-gray-500">
                Saved: {new Date(version.savedAt).toLocaleString()}
              </p>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => handleViewVersion(version.xml)}
                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
              >
                View
              </button>
              <button
                onClick={() => handleRestoreVersion(version.version)}
                disabled={isLoading} // Disable button during any loading operation
                className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors disabled:opacity-50"
              >
                Restore
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VersionHistory;

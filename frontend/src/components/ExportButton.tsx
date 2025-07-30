// Component for exporting processed bookmarks
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportBookmarks } from '../services/api';

interface ExportButtonProps {
  sessionId: string;
  fileName?: string;
}

export function ExportButton({ sessionId, fileName = 'bookmarks' }: ExportButtonProps) {
  const handleExport = async () => {
    const toastId = toast.loading('Generating export file...');

    try {
      const blob = await exportBookmarks(sessionId);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}_cleaned.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Export completed successfully!', { id: toastId });
    } catch (error) {
      toast.error('Failed to export bookmarks', { id: toastId });
      console.error('Export error:', error);
    }
  };

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
    >
      <Download className="h-4 w-4 mr-2" />
      Export Bookmarks
    </button>
  );
}

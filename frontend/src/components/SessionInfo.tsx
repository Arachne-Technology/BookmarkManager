// Component for displaying session information and metadata
import { Calendar, FileText, Hash } from 'lucide-react'
import { Session } from '../services/api'
import { ExportButton } from './ExportButton'

interface SessionInfoProps {
  session: Session
}

export function SessionInfo({ session }: SessionInfoProps) {
  const baseFileName = session.file_name?.replace('.html', '') || 'bookmarks'
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex justify-between items-start">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">File</p>
              <p className="text-sm text-gray-500">{session.file_name}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Hash className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Bookmarks</p>
              <p className="text-sm text-gray-500">{session.original_count} total</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Uploaded</p>
              <p className="text-sm text-gray-500">
                {new Date(session.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="ml-6">
          <ExportButton sessionId={session.id} fileName={baseFileName} />
        </div>
      </div>
    </div>
  )
}
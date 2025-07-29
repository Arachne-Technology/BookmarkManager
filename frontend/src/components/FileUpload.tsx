// Import React hooks and dependencies
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone' // Drag-and-drop file upload functionality
import { Upload, FileText } from 'lucide-react' // Icon components
import { useNavigate } from 'react-router-dom' // React Router navigation hook
import toast from 'react-hot-toast' // Toast notification library
import { uploadBookmarkFile } from '../services/api'

/**
 * FileUpload component provides a drag-and-drop interface for uploading bookmark HTML files
 * Handles file validation, upload progress, and navigation to the results page
 */
export function FileUpload() {
  // Hook for programmatic navigation after successful upload
  const navigate = useNavigate()
  
  /**
   * Handles file drop events and processes the uploaded bookmark file
   * Validates the file, uploads it to the server, and navigates to the results page
   */
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Get the first (and only) uploaded file
    const file = acceptedFiles[0]
    if (!file) return
    
    // Show loading toast notification to user
    const toastId = toast.loading('Uploading and parsing bookmark file...')
    
    try {
      // Upload file to backend and get parsing results
      const result = await uploadBookmarkFile(file)
      // Show success message with bookmark count
      toast.success(`Successfully parsed ${result.bookmarksCount} bookmarks!`, { id: toastId })
      // Navigate to bookmark management page for this session
      navigate(`/bookmarks/${result.sessionId}`)
    } catch (error) {
      // Show error message if upload fails
      toast.error('Failed to upload file. Please try again.', { id: toastId })
      console.error('Upload error:', error)
    }
  }, [navigate])
  
  /**
   * Configure react-dropzone with file validation and upload constraints
   * Only accepts HTML files up to 10MB in size
   */
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,                    // Callback when files are dropped
    accept: {
      'text/html': ['.html', '.htm']  // Only accept HTML files
    },
    maxFiles: 1,               // Allow only one file at a time
    maxSize: 10 * 1024 * 1024  // Maximum file size: 10MB
  })
  
  return (
    <div
      // Spread dropzone props for drag-and-drop functionality
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive 
          ? 'border-blue-400 bg-blue-50'     // Active drag state: blue border and background
          : 'border-gray-300 hover:border-gray-400'  // Default state: gray border with hover effect
      }`}
    >
      {/* Hidden file input element - required by react-dropzone */}
      <input {...getInputProps()} />
      
      <div className="space-y-4">
        {/* Dynamic icon based on drag state */}
        {isDragActive ? (
          // Upload icon when dragging
          <Upload className="h-12 w-12 text-blue-500 mx-auto" />
        ) : (
          // File icon in default state
          <FileText className="h-12 w-12 text-gray-400 mx-auto" />
        )}
        
        <div>
          {/* Dynamic text based on drag state */}
          <p className="text-lg font-medium text-gray-900">
            {isDragActive ? 'Drop your bookmark file here' : 'Drop bookmark file here, or click to select'}
          </p>
          {/* Helper text explaining supported file types and size limit */}
          <p className="text-sm text-gray-500 mt-1">
            Supports HTML export files from Chrome, Firefox, Safari, and Edge (max 10MB)
          </p>
        </div>
      </div>
    </div>
  )
}
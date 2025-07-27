import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { uploadBookmarkFile } from '../services/api'

export function FileUpload() {
  const navigate = useNavigate()
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    
    const toastId = toast.loading('Uploading and parsing bookmark file...')
    
    try {
      const result = await uploadBookmarkFile(file)
      toast.success(`Successfully parsed ${result.bookmarksCount} bookmarks!`, { id: toastId })
      navigate(`/bookmarks/${result.sessionId}`)
    } catch (error) {
      toast.error('Failed to upload file. Please try again.', { id: toastId })
      console.error('Upload error:', error)
    }
  }, [navigate])
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/html': ['.html', '.htm']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  })
  
  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive 
          ? 'border-blue-400 bg-blue-50' 
          : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <input {...getInputProps()} />
      
      <div className="space-y-4">
        {isDragActive ? (
          <Upload className="h-12 w-12 text-blue-500 mx-auto" />
        ) : (
          <FileText className="h-12 w-12 text-gray-400 mx-auto" />
        )}
        
        <div>
          <p className="text-lg font-medium text-gray-900">
            {isDragActive ? 'Drop your bookmark file here' : 'Drop bookmark file here, or click to select'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Supports HTML export files from Chrome, Firefox, Safari, and Edge (max 10MB)
          </p>
        </div>
      </div>
    </div>
  )
}
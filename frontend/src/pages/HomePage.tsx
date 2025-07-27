import React from 'react'
import { FileUpload } from '../components/FileUpload'

export function HomePage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Upload Your Bookmark File
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Upload your browser's bookmark export file and let AI help you organize 
          and clean up your collection. Supports Chrome, Firefox, Safari, and Edge exports.
        </p>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <FileUpload />
      </div>
      
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-2">1. Upload</h3>
            <p className="text-gray-600">
              Upload your browser's bookmark HTML export file
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-2">2. Review</h3>
            <p className="text-gray-600">
              Browse your bookmarks in an organized interface
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-2">3. Export</h3>
            <p className="text-gray-600">
              Download your cleaned and organized bookmark file
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
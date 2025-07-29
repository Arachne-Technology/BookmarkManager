/// <reference types="vite/client" />

/**
 * TypeScript definitions for Vite environment variables
 * This file provides type safety for import.meta.env in Vite applications
 */

interface ImportMetaEnv {
  readonly VITE_API_URL: string  // Backend API URL for frontend API calls
  readonly VITE_NODE_ENV: string // Application environment (development, production)
  // Add other environment variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
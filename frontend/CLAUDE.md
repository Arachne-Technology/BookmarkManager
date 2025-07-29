# Frontend Development Guidelines - BookmarkParser

## Context
This is the frontend directory for BookmarkParser, a React web application that provides an intuitive interface for uploading, analyzing, and managing browser bookmark collections with AI-powered content summarization.

## Technology Stack & Dependencies
- **Framework**: React 18 with TypeScript and strict mode
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS for responsive, utility-first design
- **State Management**: React Query (TanStack Query) for server state management
- **File Upload**: React Dropzone for drag-and-drop functionality
- **UI Components**: Custom components with Lucide React icons
- **Notifications**: React Hot Toast for user feedback and alerts
- **Routing**: React Router DOM for client-side navigation
- **HTTP Client**: Axios for API communication with the backend
- **Form Handling**: React Hook Form for form validation and submission

## Project Structure
```
frontend/src/
├── components/           # Reusable React components
│   ├── BookmarkDetailPane.tsx    # Detailed bookmark information panel
│   ├── BookmarkGrid.tsx          # Grid/list view for bookmarks
│   ├── BookmarkTree.tsx          # Tree view for bookmark hierarchy
│   ├── ExportButton.tsx          # Export functionality component
│   ├── FileUpload.tsx            # Drag-and-drop file upload
│   ├── FloatingActionMenu.tsx    # Floating action buttons
│   ├── Layout.tsx                # Main application layout
│   ├── LoadingSpinner.tsx        # Loading state component
│   └── SessionInfo.tsx           # Session details and statistics
├── hooks/                # Custom React hooks
│   └── useSelection.ts           # Bookmark selection state management
├── pages/                # Page-level components
│   ├── BookmarkPage.tsx          # Main bookmark management interface
│   ├── HomePage.tsx              # Landing page with upload
│   └── SettingsPage.tsx          # AI provider configuration
├── services/             # API client functions
│   └── api.ts                    # Backend API communication
├── types/                # TypeScript type definitions
├── utils/                # Frontend utilities and helpers
├── App.tsx               # Main application component
├── main.tsx              # React application entry point
└── index.css             # Global styles and Tailwind imports
```

## Development Guidelines

### Code Standards
- Use TypeScript strict mode with explicit type annotations
- Follow React best practices: functional components with hooks
- Use ESLint and Prettier for consistent code formatting
- Implement proper error boundaries for component error handling
- Use semantic HTML elements for accessibility
- Maintain consistent component naming: PascalCase for components, camelCase for props
- Add PropTypes or TypeScript interfaces for all component props

### Component Architecture
- **Functional Components**: Use function components with React hooks
- **Custom Hooks**: Extract reusable logic into custom hooks
- **Component Composition**: Prefer composition over inheritance
- **Props Interface**: Define clear TypeScript interfaces for all props
- **Error Handling**: Implement error boundaries and graceful failure states
- **Loading States**: Provide loading indicators for async operations

### State Management Strategy
- **Local State**: Use `useState` for component-specific state
- **Server State**: Use React Query for API data and caching
- **Global State**: Use React Context for shared application state
- **Form State**: Use React Hook Form for complex form management
- **Selection State**: Custom hook for bookmark selection management

### Styling Guidelines
- **Tailwind CSS**: Use utility classes for styling
- **Responsive Design**: Mobile-first approach with breakpoint prefixes
- **Component Variants**: Use conditional classes for different states
- **Custom CSS**: Minimal custom CSS, prefer Tailwind utilities
- **Dark Mode**: Implement theme switching capability
- **Accessibility**: Follow WCAG guidelines for color contrast and focus states

### API Integration
- **Axios Client**: Centralized API client in `services/api.ts`
- **React Query**: Cache and manage server state efficiently
- **Error Handling**: Consistent error handling across all API calls
- **Request Interceptors**: Add authentication and common headers
- **Response Handling**: Standard response format processing
- **Loading States**: Show appropriate loading indicators during API calls

## Key Components and Features

### File Upload (`components/FileUpload.tsx`)
- **Drag-and-Drop**: React Dropzone integration for intuitive file upload
- **File Validation**: Client-side validation for HTML files and size limits
- **Progress Indicators**: Visual feedback during upload process
- **Error Handling**: Clear error messages for upload failures
- **Multiple Files**: Support for uploading multiple bookmark files
- **File Preview**: Show file information before upload confirmation

### Bookmark Tree View (`components/BookmarkTree.tsx`)
- **Hierarchical Display**: Tree structure showing folder organization
- **Selection Interface**: Checkboxes for selective AI analysis
- **Expandable Nodes**: Collapsible folder structure
- **Search Functionality**: Filter bookmarks by title, URL, or folder
- **Batch Selection**: Select entire folders or individual bookmarks
- **Visual Indicators**: Icons and badges for different bookmark states

### Bookmark Management (`components/BookmarkGrid.tsx`)
- **Grid/List Toggle**: Switch between grid cards and list view
- **Filtering Options**: Filter by status, folder, AI analysis state
- **Sorting Controls**: Sort by title, date, folder, or AI status
- **Batch Operations**: Select multiple bookmarks for bulk actions
- **AI Status Display**: Show analysis progress and results
- **Action Buttons**: Keep, delete, categorize, and analyze actions

### AI Provider Configuration (`pages/SettingsPage.tsx`)
- **Provider Selection**: Choose between Claude, OpenAI, and local Llama
- **API Key Management**: Secure input and validation for API keys
- **Rate Limiting**: Configure per-provider rate limits
- **Test Connection**: Validate API keys and provider availability
- **Cost Tracking**: Display estimated costs and usage statistics
- **Default Settings**: Set preferred AI provider and analysis settings

### Real-time Updates
- **WebSocket Integration**: Live updates for analysis progress
- **Progress Tracking**: Real-time job queue status and completion
- **Toast Notifications**: Immediate feedback for user actions
- **Status Indicators**: Dynamic status updates throughout the interface
- **Auto-refresh**: Automatic data refresh for long-running operations

## User Experience Guidelines

### Responsive Design
- **Mobile-first**: Design for mobile devices first, then scale up
- **Breakpoints**: Use Tailwind's responsive prefixes (sm, md, lg, xl)
- **Touch Targets**: Ensure buttons are adequately sized for touch
- **Navigation**: Implement mobile-friendly navigation patterns
- **Content Priority**: Show most important content first on small screens

### Accessibility
- **Keyboard Navigation**: Full keyboard accessibility for all interactions
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Meet WCAG AA standards for color contrast
- **Focus Management**: Clear focus indicators and logical tab order
- **Error Messages**: Descriptive error messages linked to form fields

### Performance Optimization
- **Code Splitting**: Lazy load routes and components
- **Virtual Scrolling**: Handle large bookmark lists efficiently
- **Image Optimization**: Optimize bookmark thumbnails and icons
- **Bundle Size**: Monitor and minimize JavaScript bundle size
- **Caching**: Leverage browser caching for static assets

## Development Commands
```bash
# Install dependencies
npm install

# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format
```

## Environment Configuration
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api
VITE_WEBSOCKET_URL=ws://localhost:3001

# Feature Flags
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_LOCAL_AI=false
VITE_DEBUG_MODE=false

# Upload Configuration
VITE_MAX_FILE_SIZE=10485760  # 10MB in bytes
VITE_SUPPORTED_FORMATS=.html

# UI Configuration
VITE_DEFAULT_GRID_SIZE=20
VITE_ITEMS_PER_PAGE=50
```

## Component Development Patterns

### Hooks Pattern
```typescript
// Custom hook for bookmark selection
const useBookmarkSelection = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  }, []);
  
  return { selectedIds, isSelectMode, toggleSelection };
};
```

### Error Boundary Pattern
```typescript
// Error boundary for component error handling
const BookmarkErrorBoundary: React.FC<{children: React.ReactNode}> = ({children}) => {
  return (
    <ErrorBoundary
      fallback={<ErrorFallback />}
      onError={(error) => console.error('Bookmark component error:', error)}
    >
      {children}
    </ErrorBoundary>
  );
};
```

### Loading State Pattern
```typescript
// Consistent loading state handling
const BookmarkList: React.FC = () => {
  const { data: bookmarks, isLoading, error } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: fetchBookmarks
  });
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!bookmarks?.length) return <EmptyState />;
  
  return <BookmarkGrid bookmarks={bookmarks} />;
};
```

## Testing Strategy
- **Unit Tests**: Test individual components and hooks with React Testing Library
- **Integration Tests**: Test component interactions and API integration
- **E2E Tests**: Test complete user workflows with Cypress
- **Visual Tests**: Snapshot testing for UI consistency
- **Accessibility Tests**: Automated accessibility testing with axe-core
- **Performance Tests**: Monitor component render times and bundle size

## Current Implementation Status

### ✅ Implemented
- React app with TypeScript and Vite setup
- File upload component with drag-and-drop
- Basic bookmark tree view display
- Responsive layout with Tailwind CSS
- API client with Axios integration
- Session management interface
- Basic routing and navigation

### 🚧 In Progress
- AI provider configuration interface
- Bookmark selection system with checkboxes
- Real-time progress tracking
- Advanced filtering and search

### ⏳ Pending
- WebSocket integration for live updates
- Export functionality interface
- Comprehensive error handling
- Performance optimizations
- Complete test suite
- Accessibility improvements

## API Integration Points

### Upload Flow
```typescript
// File upload with progress tracking
const uploadBookmarkFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('bookmarkFile', file);
  
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progress) => updateProgress(progress)
  });
};
```

### Bookmark Management
```typescript
// Fetch bookmarks with filtering
const fetchBookmarks = async (filters: BookmarkFilters): Promise<Bookmark[]> => {
  const params = new URLSearchParams(filters);
  return api.get(`/bookmarks?${params}`);
};

// Update bookmark status
const updateBookmark = async (id: string, updates: BookmarkUpdate): Promise<void> => {
  return api.put(`/bookmarks/${id}`, updates);
};
```

### AI Provider Configuration
```typescript
// Configure AI provider
const configureProvider = async (config: ProviderConfig): Promise<void> => {
  return api.post('/providers/config', config);
};

// Test provider connection
const testProvider = async (provider: string, apiKey: string): Promise<boolean> => {
  return api.post('/providers/test', { provider, apiKey });
};
```

## Important Notes
- All sensitive data (API keys) should be handled securely and never logged
- Implement proper loading states for all async operations
- Use React Query for efficient server state management and caching
- Follow responsive design principles for mobile compatibility
- Maintain accessibility standards throughout the application
- Implement proper error boundaries to prevent application crashes
- Use TypeScript strictly to catch errors at compile time
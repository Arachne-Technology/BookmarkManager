# BookmarkParser - Web Application Architecture

## System Overview

BookmarkParser is a containerized web application built with a React frontend and Node.js backend, designed to analyze and manage browser bookmark exports using AI-powered content summarization.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   Express API   │    │   PostgreSQL    │
│   (Frontend)    │────│   (Backend)     │────│   (Database)    │
│   Port 3000     │    │   Port 3001     │    │   Port 5432     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Redis + Bull   │    │   Puppeteer     │
                       │ (Cache & Queue) │    │   (Scraper)     │
                       │   Port 6379     │    │                 │
                       └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │  AI Provider    │
                       │   Abstraction   │
                       │     Layer       │
                       └─────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Claude API     │    │  OpenAI API     │    │  Local Llama    │
│ (Anthropic)     │    │     (GPT)       │    │    (Node)       │
│   (External)    │    │   (External)    │    │    (Local)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Technology Stack

### Frontend (React App)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React Query for server state management
- **File Upload**: React Dropzone for drag-and-drop functionality
- **UI Components**: Custom components with Lucide React icons
- **Notifications**: React Hot Toast for user feedback

### Backend (Express API)
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with security middleware
- **File Upload**: Multer for multipart form handling
- **HTML Parsing**: Cheerio for bookmark HTML processing
- **Web Scraping**: Puppeteer for dynamic content fetching
- **AI Integration**: Multi-provider abstraction layer
  - **Anthropic**: Claude SDK for high-quality summaries
  - **OpenAI**: GPT-4 API for alternative analysis
  - **Local**: Node Llama CPP for privacy-focused processing
- **Job Queue**: Bull with Redis for async AI processing
- **Database**: PostgreSQL with node-postgres (pg)
- **Caching**: Redis for session and analysis caching
- **Security**: Helmet, CORS, rate limiting

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for development
- **Database**: PostgreSQL 15 for reliable data storage
- **Cache**: Redis 7 for fast session and content caching
- **Reverse Proxy**: Nginx (production) for static file serving

## Data Flow

### 1. File Upload Process
```
User → Frontend Upload → Backend Validation → Temp Storage → Parser → Database
```

### 2. AI Provider Configuration
```
User → Provider Selection → API Key Configuration → Provider Validation → Session Storage
```

### 3. Selective Processing Setup
```
Bookmark Tree → User Selection → Queue Creation
```

### 4. AI Analysis Pipeline
```
Queue Job → Provider Router → Rate Limiter → Content Fetcher → AI Provider → Cache → Database
```

### 5. Real-time Updates
```
WebSocket → Progress Updates → Queue Status → Frontend Dashboard
```

### 6. Interactive Management
```
Frontend Grid → Filter/Search → Database Queries → Real-time Updates → User Actions
```

### 7. Export Generation
```
User Selection → Backend Processing → HTML Generation → File Download → Cleanup
```

## Database Schema

### Tables
```sql
-- User sessions (temporary, no persistent accounts)
sessions (
  id: UUID PRIMARY KEY,
  created_at: TIMESTAMP,
  expires_at: TIMESTAMP,
  file_name: VARCHAR,
  original_count: INTEGER,
  processed_count: INTEGER,
  selected_provider: VARCHAR DEFAULT 'claude'
)

-- AI provider configurations per session
provider_configs (
  id: UUID PRIMARY KEY,
  session_id: UUID REFERENCES sessions(id),
  provider: ENUM('claude', 'openai', 'llama'),
  api_key_hash: VARCHAR, -- encrypted storage
  is_active: BOOLEAN DEFAULT false,
  rate_limit: INTEGER DEFAULT 60, -- requests per minute
  created_at: TIMESTAMP
)

-- Parsed bookmarks with metadata
bookmarks (
  id: UUID PRIMARY KEY,
  session_id: UUID REFERENCES sessions(id),
  title: VARCHAR,
  url: VARCHAR,
  folder_path: VARCHAR,
  original_index: INTEGER,
  status: ENUM('pending', 'selected', 'queued', 'analyzing', 'analyzed', 'error', 'skipped'),
  is_accessible: BOOLEAN,
  selected_for_analysis: BOOLEAN DEFAULT false,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)

-- AI-generated summaries and analysis
summaries (
  id: UUID PRIMARY KEY,
  bookmark_id: UUID REFERENCES bookmarks(id),
  provider: VARCHAR NOT NULL,
  content_summary: TEXT,
  content_type: VARCHAR,
  word_count: INTEGER,
  token_count: INTEGER,
  analysis_duration: INTEGER,
  model_version: VARCHAR,
  created_at: TIMESTAMP
)

-- User decisions and actions
user_actions (
  id: UUID PRIMARY KEY,
  bookmark_id: UUID REFERENCES bookmarks(id),
  action: ENUM('keep', 'delete', 'categorize', 'flag'),
  new_category: VARCHAR,
  notes: TEXT,
  created_at: TIMESTAMP
)

-- Processing queue and job tracking
processing_jobs (
  id: UUID PRIMARY KEY,
  session_id: UUID REFERENCES sessions(id),
  bookmark_ids: UUID[], -- array of bookmark IDs
  provider: VARCHAR NOT NULL,
  status: ENUM('queued', 'processing', 'completed', 'failed', 'cancelled'),
  priority: INTEGER DEFAULT 5,
  started_at: TIMESTAMP,
  completed_at: TIMESTAMP,
  error_message: TEXT
)
```

## API Endpoints

### Core Operations
```
POST   /api/upload              # Upload bookmark HTML file
GET    /api/sessions/:id        # Get session details
POST   /api/sessions/:id/analyze # Start selective analysis process
GET    /api/bookmarks           # List bookmarks with filters and AI status
PUT    /api/bookmarks/:id       # Update bookmark status/category
DELETE /api/bookmarks/:id       # Mark bookmark for deletion
POST   /api/export              # Generate export file
GET    /api/download/:fileId    # Download generated file
```

### AI Provider Management
```
GET    /api/providers           # List available AI providers
POST   /api/providers/config    # Configure AI provider for session
PUT    /api/providers/:id       # Update provider configuration
DELETE /api/providers/:id       # Remove provider configuration
POST   /api/providers/test      # Test provider connection
```

### Selection & Processing Management
```
POST   /api/queue/submit        # Submit selected bookmarks for processing
GET    /api/queue/status        # Get queue status and progress
POST   /api/queue/pause         # Pause processing queue
POST   /api/queue/resume        # Resume processing queue
DELETE /api/queue/:jobId        # Cancel specific job
PUT    /api/queue/:jobId/priority # Change job priority
```

### Analysis & Management
```
GET    /api/sessions/:id/stats  # Get analysis statistics
POST   /api/bookmarks/batch     # Batch operations
GET    /api/summaries/:id       # Get AI summary details with provider info
POST   /api/analyze/retry       # Retry failed analyses
GET    /api/analyze/progress    # Real-time analysis progress via WebSocket
```

## Component Architecture

### Frontend Components
```
src/
├── components/
│   ├── Layout/
│   │   ├── Header.tsx
│   │   ├── Navigation.tsx
│   │   └── Footer.tsx
│   ├── Upload/
│   │   ├── FileUpload.tsx
│   │   ├── UploadProgress.tsx
│   │   └── FileValidator.tsx
│   ├── Dashboard/
│   │   ├── StatsOverview.tsx
│   │   ├── ProgressTracker.tsx
│   │   └── ActionSummary.tsx
│   ├── BookmarkGrid/
│   │   ├── BookmarkCard.tsx
│   │   ├── GridControls.tsx
│   │   ├── FilterPanel.tsx
│   │   └── BatchActions.tsx
│   └── Export/
│       ├── ExportOptions.tsx
│       ├── DownloadButton.tsx
│       └── ExportStats.tsx
```

### Backend Services
```
src/
├── services/
│   ├── bookmarkParser.ts     # HTML parsing logic
│   ├── contentScraper.ts     # Web content fetching
│   ├── aiSummarizer.ts       # Claude API integration
│   ├── sessionManager.ts     # Session handling
│   ├── exportGenerator.ts    # HTML export creation
│   └── cacheManager.ts       # Redis operations
├── routes/
│   ├── upload.ts             # File upload endpoints
│   ├── bookmarks.ts          # Bookmark CRUD operations
│   ├── analysis.ts           # AI analysis endpoints
│   └── export.ts             # Export and download
```

## Security Considerations

### File Upload Security
- File type validation (HTML only)
- Size limits (10MB maximum)
- Virus scanning integration points
- Temporary file cleanup
- No executable file processing

### API Security
- Rate limiting per IP address
- CORS configuration for frontend only
- Input validation and sanitization
- SQL injection prevention
- XSS protection headers

### Data Privacy
- No persistent user accounts
- Automatic session expiration
- Local processing priority
- Secure API key management
- Content caching with TTL

## Performance Optimization

### Frontend
- Code splitting by routes
- Lazy loading of components
- Image optimization for thumbnails
- Virtual scrolling for large lists
- Debounced search and filters

### Backend
- Connection pooling for database
- Redis caching for AI summaries
- Async processing for analysis
- Batch operations for bulk updates
- Rate limiting for external APIs

### Infrastructure
- Multi-stage Docker builds
- Static asset optimization
- Database indexing strategy
- CDN readiness for production

## Development Workflow

### Local Setup
```bash
# Clone and setup
git clone <repo>
cd BookmarkParser

# Start development environment
docker-compose -f docker-compose.dev.yml up

# Access applications
Frontend: http://localhost:3000
Backend:  http://localhost:3001
Database: localhost:5432
Redis:    localhost:6379
```

### Environment Configuration
```env
# Required
CLAUDE_API_KEY=your_claude_api_key
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/bookmarks
REDIS_URL=redis://redis:6379

# Server
PORT=3001
FRONTEND_URL=http://localhost:3000
UPLOAD_LIMIT=10mb

# Optional
LOG_LEVEL=info
SESSION_TIMEOUT=3600
ANALYSIS_BATCH_SIZE=10
```

## Deployment Strategy

### Development
- Docker Compose with hot reload
- Volume mounts for code changes
- Environment variable injection
- Development database seeding

### Production
- Multi-stage Docker builds
- Health checks and restart policies
- Resource limits and scaling
- Production database migrations
- SSL/TLS termination
- Monitoring and logging integration
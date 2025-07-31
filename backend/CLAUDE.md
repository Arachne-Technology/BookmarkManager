# Backend Development Guidelines - BookmarkParser

## 📋 Backend Action Items
**See [TODO.md](./TODO.md) for backend-specific immediate action items and development priorities.**

## Context
This is the backend directory for BookmarkParser, a Node.js/Express API server that handles bookmark parsing, AI analysis, and data management. The backend provides REST endpoints for the React frontend and manages AI provider integrations.

## Technology Stack & Dependencies
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with security middleware
- **Database**: PostgreSQL with node-postgres (pg)
- **Caching**: Redis for sessions and content caching
- **File Upload**: Multer for multipart form handling
- **HTML Parsing**: Cheerio for bookmark HTML processing
- **Web Scraping**: Puppeteer for dynamic content fetching
- **AI Integration**: Multi-provider abstraction layer
  - Anthropic Claude SDK for high-quality summaries
  - OpenAI GPT-4 API for alternative analysis
  - Node Llama CPP for local processing (optional)
- **Job Queue**: Bull with Redis for async AI processing
- **Security**: Helmet, CORS, rate limiting middleware

## Project Structure
```
backend/src/
├── ai/                    # AI provider integration
│   ├── AIService.ts       # Main AI service orchestrator
│   ├── BaseAIProvider.ts  # Abstract base class for providers
│   ├── WebScraperService.ts # Content fetching service
│   ├── providers/         # AI provider implementations
│   │   ├── ClaudeProvider.ts
│   │   └── OpenAIProvider.ts
│   └── types.ts          # AI-related type definitions
├── middleware/           # Express middleware
│   └── errorHandler.ts   # Global error handling
├── models/              # Database models and schemas
├── parsers/             # HTML parsing logic
│   └── bookmarkParser.ts # Browser bookmark HTML parser
├── routes/              # Express route handlers
│   ├── ai.ts           # AI provider management endpoints
│   ├── bookmarks.ts    # Bookmark CRUD operations
│   ├── export.ts       # Export and download endpoints
│   ├── index.ts        # Route aggregation
│   ├── sessions.ts     # Session management
│   ├── settings.ts     # Application settings
│   └── upload.ts       # File upload handling
├── services/           # Business logic layer
│   └── exportService.ts # HTML export generation
├── types/              # TypeScript type definitions
├── utils/              # Shared utilities
│   ├── database.ts     # Database connection and utilities
│   ├── logger.ts       # Logging configuration
│   └── modelCache.ts   # AI model response caching
└── server.ts           # Express server entry point
```

## Development Guidelines

### Code Standards
- Use TypeScript strict mode with explicit type annotations
- Follow ESLint recommended rules (configured in root)
- Implement comprehensive error handling with custom error types
- Use async/await for all asynchronous operations
- Add JSDoc comments for all public APIs and complex logic
- Maintain consistent naming: camelCase for variables/functions, PascalCase for classes/interfaces

### Database Integration
- Use PostgreSQL with connection pooling via `utils/database.ts`
- All database operations should use transactions for data consistency
- Use UUID primary keys for better distribution
- Implement soft deletes where appropriate
- Store session data with automatic expiration
- Cache AI summaries to avoid redundant API calls

### AI Provider Architecture
- Implement the Strategy pattern: all providers extend `BaseAIProvider`
- Use the Factory pattern: `AIService` dynamically instantiates providers
- Implement per-provider rate limiting and retry logic
- Track token usage and costs for each provider
- Support graceful fallback when providers fail
- Store provider configurations securely per session

### API Design Patterns
- Follow RESTful conventions for resource endpoints
- Use middleware for authentication, validation, and error handling
- Implement consistent response formats with proper HTTP status codes
- Add request/response logging for debugging
- Support pagination for large datasets
- Implement proper CORS configuration for frontend integration

### File Handling Security
- Validate file types (HTML only) and size limits (10MB max)
- Use secure temporary storage with automatic cleanup
- Sanitize file content during parsing
- Never execute uploaded content
- Implement virus scanning integration points

### Error Handling Strategy
- Use custom error classes for different failure modes:
  - `ValidationError` for input validation
  - `DatabaseError` for database operations
  - `AIProviderError` for AI service failures
  - `FileProcessingError` for upload/parsing issues
- Implement retry logic for network operations
- Log all errors with appropriate severity levels
- Return user-friendly error messages without exposing internal details

### Performance Best Practices
- Use connection pooling for database operations
- Implement Redis caching for frequently accessed data
- Process AI analysis jobs asynchronously with Bull queue
- Use streaming for large file processing
- Implement rate limiting for external API calls
- Batch database operations where possible

## Key Implementation Areas

### Bookmark Parsing (`parsers/bookmarkParser.ts`)
- Support Chrome, Firefox, Safari, Edge bookmark formats
- Preserve folder hierarchy and metadata
- Handle malformed HTML gracefully
- Process large collections (10,000+ bookmarks) efficiently
- Extract bookmark titles, URLs, folder paths, and timestamps

### AI Integration (`ai/` directory)
- **AIService**: Main orchestrator for provider management
- **BaseAIProvider**: Abstract base class with common functionality
- **Provider Implementations**: Claude, OpenAI, and optional Llama
- Support selective processing based on user selection
- Implement proper rate limiting per provider
- Cache summaries to avoid redundant API calls

### Session Management (`routes/sessions.ts`)
- Create temporary sessions for bookmark collections
- Store provider configurations securely
- Track processing progress and statistics
- Implement automatic session cleanup
- Support session resumption for long-running tasks

### Job Queue Management
- Use Bull with Redis for async AI processing
- Implement job priorities and batch processing
- Support pause/resume functionality
- Track job progress and provide real-time updates
- Handle job failures with retry logic

## Environment Configuration

### Required Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/bookmarks
REDIS_URL=redis://redis:6379

# AI Providers (at least one required)
CLAUDE_API_KEY=your_claude_api_key
OPENAI_API_KEY=your_openai_api_key

# Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
UPLOAD_LIMIT=10mb
SESSION_TIMEOUT=3600

# Optional Settings
LOG_LEVEL=info
DEFAULT_AI_PROVIDER=claude
RATE_LIMIT_REQUESTS_PER_MINUTE=60
ANALYSIS_BATCH_SIZE=10
```

## Development Commands
```bash
# Install dependencies
npm install

# Development server with hot reload
npm run dev

# Build TypeScript
npm run build

# Run tests
npm run test

# Type checking
npm run typecheck

# Linting
npm run lint

# Database migrations
npm run migrate

# Start production server
npm start
```

## Testing Strategy
- **Unit Tests**: Test individual services, parsers, and utilities
- **Integration Tests**: Test API endpoints with real database
- **Mock Tests**: Mock external AI providers for reliable testing
- **Error Testing**: Test error handling and edge cases
- **Performance Tests**: Test with large bookmark collections

## Security Considerations
- Store API keys securely using environment variables
- Implement input validation for all endpoints
- Use parameterized queries to prevent SQL injection
- Sanitize HTML content during parsing
- Implement rate limiting to prevent abuse
- Use HTTPS in production
- Regular security audits of dependencies

## Current Implementation Status

### ✅ Implemented
- Basic Express server with TypeScript
- File upload handling with Multer
- Bookmark HTML parser for major browsers
- Database models and migrations
- Session management system
- Basic AI provider structure
- Error handling middleware

### 🚧 In Progress
- AI provider configuration endpoints
- Queue management system for batch processing
- WebSocket integration for real-time updates

### ⏳ Pending
- Complete AI analysis pipeline
- Export service implementation
- Performance optimization
- Comprehensive test suite

## Key APIs and Endpoints

### Core Operations
- `POST /api/upload` - Upload and parse bookmark HTML files
- `GET /api/sessions/:id` - Retrieve session details and statistics
- `GET /api/bookmarks` - List bookmarks with filtering and pagination
- `PUT /api/bookmarks/:id` - Update bookmark status or category
- `POST /api/export` - Generate cleaned bookmark HTML file

### AI Provider Management
- `GET /api/providers` - List available AI providers
- `POST /api/providers/config` - Configure provider for current session
- `POST /api/providers/test` - Test provider connection and API key
- `PUT /api/providers/:id` - Update provider configuration

### Queue and Processing
- `POST /api/queue/submit` - Submit selected bookmarks for AI analysis
- `GET /api/queue/status` - Get current queue status and progress
- `POST /api/queue/pause` - Pause processing queue
- `POST /api/queue/resume` - Resume processing queue

## Important Notes
- All AI provider API keys are stored temporarily in Redis and never persisted
- Sessions automatically expire after the configured timeout period
- Large bookmark collections are processed in configurable batches
- All file uploads are validated and stored in secure temporary directories
- Database operations use transactions to ensure data consistency
- Redis is used for both caching and job queue management
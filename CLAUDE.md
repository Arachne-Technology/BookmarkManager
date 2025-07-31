# BookmarkParser - AI-Powered Bookmark Analysis Web Application

## Project Overview
A containerized web application that helps users analyze messy browser bookmark exports by providing AI-generated summaries and enabling interactive bookmark management through a modern web interface.

## 📋 Current Action Items
**See [TODO.md](./TODO.md) for immediate action items and development priorities.**

## Development Guidelines

### Technology Stack
- **Backend**: Node.js 18+ with TypeScript and Express.js
- **Frontend**: React 18+ with TypeScript and Tailwind CSS
- **HTML Parsing**: Cheerio for bookmark HTML manipulation
- **Web Scraping**: Puppeteer for dynamic content fetching
- **AI Integration**: Anthropic Claude API for content summarization
- **Data Storage**: Redis for session data, PostgreSQL for persistent data
- **File Upload**: Multer for handling bookmark HTML uploads
- **Containerization**: Docker with multi-stage builds
- **Testing**: Jest for unit tests, Cypress for end-to-end testing

### Code Standards
- Use TypeScript strict mode
- Follow ESLint recommended rules
- Implement proper error handling with custom error types
- Use async/await for all asynchronous operations
- Add JSDoc comments for public APIs
- Maintain 80% test coverage minimum

### Project Structure
```
backend/
├── src/
│   ├── routes/        # Express route handlers
│   ├── services/      # Business logic layer
│   ├── parsers/       # Bookmark HTML parsing
│   ├── scrapers/      # Web content fetching
│   ├── ai/            # AI integration and summarization
│   ├── models/        # Data models and database schemas
│   ├── middleware/    # Express middleware
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Shared utilities
├── uploads/           # Temporary file storage
└── tests/             # Backend test files

frontend/
├── src/
│   ├── components/    # React components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom React hooks
│   ├── services/      # API client functions
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Frontend utilities
├── public/            # Static assets
└── tests/             # Frontend test files

docker/                # Docker configuration files
docs/                  # Additional documentation
sample-data/           # Sample bookmark files for testing
```

### Development Commands
- `docker-compose up -d` - Start development environment
- `npm run dev:backend` - Start backend development server
- `npm run dev:frontend` - Start frontend development server
- `npm run build` - Build both frontend and backend
- `npm run test` - Run full test suite
- `npm run lint` - Run ESLint on all code
- `npm run typecheck` - Run TypeScript compiler check

### Environment Variables
- **AI Provider Keys** (at least one required):
  - `CLAUDE_API_KEY` - Anthropic Claude API key
  - `OPENAI_API_KEY` - OpenAI GPT API key
  - `LLAMA_MODEL_PATH` - Path to local Llama model (optional)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `NODE_ENV` - Environment (development, production)
- `PORT` - Backend server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)
- `LOG_LEVEL` - Logging level (debug, info, warn, error)
- `UPLOAD_LIMIT` - Maximum file upload size (default: 10MB)
- `DEFAULT_AI_PROVIDER` - Default AI provider (claude, openai, llama)
- `RATE_LIMIT_REQUESTS_PER_MINUTE` - Global rate limit for AI requests

### Backend Dependencies
- Express.js with TypeScript
- Cheerio for HTML parsing
- Puppeteer for web scraping
- Anthropic Claude SDK
- OpenAI SDK
- Node Llama CPP (optional)
- PostgreSQL client
- Redis client
- Rate limiting middleware
- Security middleware
- Logging utilities
- Job queue management

### Frontend Dependencies
- React with TypeScript
- React Router for navigation
- Axios for API calls
- React Query for server state
- React Dropzone for file uploads
- React Hot Toast for notifications
- Lucide React for icons
- Tailwind CSS for styling
- Vite for build tooling

### Key Features to Implement
1. **File Upload Interface**: ✅ Web form for uploading bookmark HTML files
2. **Bookmark Parser**: ✅ Parse Chrome/Firefox/Safari HTML exports on server
3. **Multi-Provider AI Engine**: 🚧 Support Claude, OpenAI, and local Llama models
4. **Selective Processing**: 🚧 Choose individual bookmarks or folders for AI analysis
5. **Interactive Web UI**: 🚧 Grid/list view with AI provider selection
6. **Queue Management**: ⏳ Batch processing with rate limiting and priority handling
7. **Session Management**: ✅ Store user sessions, provider configs, and bookmark state
8. **Export Engine**: ⏳ Generate cleaned bookmark HTML files for download
9. **Batch Operations**: ⏳ Handle broken links, duplicate detection via web interface

### Web Application Features
- **Responsive Design**: ✅ Mobile-friendly interface using Tailwind CSS
- **Real-time Updates**: ⏳ WebSocket connections for live analysis progress and cost tracking
- **AI Provider Management**: 🚧 Configuration interface for multiple AI backends
- **Provider Configuration**: 🚧 Easy AI provider setup and configuration
- **Selective Processing**: 🚧 Tree view for choosing bookmarks/folders to analyze
- **Queue Visualization**: ⏳ Processing queue with pause/resume/reorder capabilities
- **File Management**: ✅ Secure upload handling with validation
- **User Sessions**: ✅ Temporary sessions with provider preferences
- **Progress Tracking**: ⏳ Visual indicators for analysis and cleanup progress
- **Download Management**: ⏳ Secure file generation and download handling

### Error Handling Strategy
- Use custom error classes for different failure modes
- Implement retry logic for network operations
- Graceful degradation when AI services are unavailable
- Comprehensive logging with different verbosity levels

### Docker Configuration
- **Multi-stage builds**: Separate build and runtime environments
- **Service orchestration**: Docker Compose for development
- **Production ready**: Optimized images with security best practices
- **Database integration**: PostgreSQL and Redis containers
- **Environment isolation**: All dependencies containerized

### Testing Strategy
- **Backend**: Unit tests for parsers, scrapers, API endpoints
- **Frontend**: Component tests with React Testing Library
- **Integration**: End-to-end tests with Cypress
- **API Testing**: Automated testing of REST endpoints
- **Container Testing**: Docker image validation and security scanning
- **Mock Services**: External API mocking for reliable testing

---

### Current Implementation Status (Updated July 31, 2025)

#### ✅ Phase 1 Complete: Foundation & Infrastructure
- Docker containerization with PostgreSQL/Redis
- File upload system with Multer validation
- Comprehensive bookmark HTML parser (Chrome/Firefox/Safari/Edge)
- React frontend with tree view display
- Session management and temporary storage
- Responsive UI with Tailwind CSS

#### ✅ Phase 2 Complete: Core AI Features
- Multi-provider AI service architecture (Claude, OpenAI, local models)
- Complete AI analysis pipeline with quality scoring
- Expert mode for detailed analysis data inspection
- AI provider configuration and testing endpoints
- Content extraction with multiple fallback methods
- Database schema for storing AI analysis results

#### 🚧 Phase 3 In Progress: User Interface Enhancements
**Current Priority Items:**
1. Fix expert mode JSON parsing error (database contains empty strings)
2. Implement bookmark selection checkboxes in tree view
3. Build AI provider configuration UI interface
4. Add processing queue management system

**Recently Completed:**
- Expert mode modal with extraction/AI analysis tabs
- AI quality assessment and issue tracking
- Content extraction metadata storage
- Web scraping service with Puppeteer integration

#### ⏳ Phase 4 Pending: Advanced Features
- Real-time WebSocket updates for processing status
- Export functionality for cleaned bookmarks
- Batch operations for duplicate detection
- Performance optimizations for large collections

### Key Technical Achievements
- Robust HTML parsing handles nested folder structures
- Memory-efficient file processing for large bookmark collections
- Clean separation of concerns (parser/services/routes/components)
- Production-ready Docker configuration
- Multi-provider AI abstraction with graceful fallbacks
- Comprehensive quality scoring and issue detection
- Expert mode for technical analysis and debugging
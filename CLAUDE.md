# BookmarkParser - AI-Powered Bookmark Analysis Web Application

## Project Overview
A containerized web application that helps users analyze messy browser bookmark exports by providing AI-generated summaries and enabling interactive bookmark management through a modern web interface.

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
- `MAX_COST_PER_SESSION` - Maximum allowed cost per session (USD)
- `RATE_LIMIT_REQUESTS_PER_MINUTE` - Global rate limit for AI requests

### Backend Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "multer": "^1.4.5-lts.1",
    "cheerio": "^1.0.0-rc.12",
    "puppeteer": "^21.0.0",
    "@anthropic-ai/sdk": "^0.24.0",
    "openai": "^4.0.0",
    "node-llama-cpp": "^2.7.0",
    "pg": "^8.11.0",
    "redis": "^4.6.0",
    "express-rate-limit": "^6.8.0",
    "compression": "^1.7.4",
    "winston": "^3.10.0",
    "bull": "^4.11.0",
    "ioredis": "^5.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/express": "^4.17.0",
    "@types/cors": "^2.8.0",
    "@types/multer": "^1.4.7",
    "@types/pg": "^8.10.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0",
    "nodemon": "^3.0.0"
  }
}
```

### Frontend Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.14.0",
    "axios": "^1.4.0",
    "react-query": "^3.39.0",
    "react-dropzone": "^14.2.0",
    "react-hot-toast": "^2.4.0",
    "lucide-react": "^0.263.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^4.4.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

### Key Features to Implement
1. **File Upload Interface**: Web form for uploading bookmark HTML files
2. **Bookmark Parser**: Parse Chrome/Firefox/Safari HTML exports on server
3. **Multi-Provider AI Engine**: Support Claude, OpenAI, and local Llama models
4. **Cost Management System**: Real-time cost tracking and budget controls
5. **Selective Processing**: Choose individual bookmarks or folders for AI analysis
6. **Interactive Web UI**: Grid/list view with AI provider selection and cost dashboard
7. **Queue Management**: Batch processing with rate limiting and priority handling
8. **Session Management**: Store user sessions, provider configs, and bookmark state
9. **Export Engine**: Generate cleaned bookmark HTML files for download
10. **Batch Operations**: Handle broken links, duplicate detection via web interface

### Web Application Features
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS
- **Real-time Updates**: WebSocket connections for live analysis progress and cost tracking
- **AI Provider Management**: Configuration interface for multiple AI backends
- **Cost Control Dashboard**: Real-time cost tracking with budget alerts
- **Selective Processing**: Tree view for choosing bookmarks/folders to analyze
- **Queue Visualization**: Processing queue with pause/resume/reorder capabilities
- **File Management**: Secure upload handling with validation
- **User Sessions**: Temporary sessions with provider preferences and cost tracking
- **Progress Tracking**: Visual indicators for analysis and cleanup progress
- **Download Management**: Secure file generation and download handling

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
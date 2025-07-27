# BookmarkParser - Phase 1 MVP

Containerized web application for organizing and managing browser bookmark collections with a modern web interface.

## Overview

BookmarkParser helps users efficiently organize their bookmark collections through an intuitive web interface. Upload your browser bookmarks, review them in an organized display, and download a cleaned collection. Phase 1 focuses on core functionality with AI features planned for Phase 2.

### Current Features (Phase 1)

- **Multi-Browser Support** - Import from Chrome, Firefox, Safari, Edge HTML exports
- **Modern Web UI** - Responsive React interface with drag-and-drop upload
- **Bookmark Management** - View and organize bookmarks in structured display
- **Export Functionality** - Download cleaned HTML bookmark files
- **Containerized** - One-command Docker deployment with PostgreSQL and Redis
- **Session Management** - Temporary sessions for bookmark processing

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BookmarkParser
   ```

2. **Start the application**
   ```bash
   docker-compose up -d
   ```

3. **Access the web interface**
   ```
   Frontend: http://localhost:3000
   Backend API: http://localhost:3001
   ```

### Basic Usage

1. **Upload** your browser bookmark export file via drag-and-drop
2. **Review** your bookmarks in the organized interface
3. **Browse** bookmarks by folder structure
4. **Export** your cleaned bookmark collection as HTML

## Development

### Project Structure

### Development Commands

```bash
# Start development environment
docker-compose up -d

# Backend development server
npm run dev:backend

# Frontend development server  
npm run dev:frontend

# Run tests
npm run test

# Code quality checks
npm run lint
npm run typecheck

# Build for production
npm run build
```

### Technology Stack

**Backend:**
- Node.js 18+ with TypeScript
- Express.js web framework
- PostgreSQL database
- Redis for caching and queues
- Cheerio for HTML parsing
- Puppeteer for web scraping

**Frontend:**
- React 18+ with TypeScript
- Tailwind CSS for styling
- React Query for state management
- React Router for navigation
- Lucide icons

**AI Providers:**
- Anthropic Claude API
- OpenAI GPT-4 API
- Local Llama models (optional)

## Environment Variables

### Required

- `CLAUDE_API_KEY` - Anthropic Claude API key
- `OPENAI_API_KEY` - OpenAI API key
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string

### Optional

- `NODE_ENV` - Environment (development/production)
- `PORT` - Backend server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS
- `LOG_LEVEL` - Logging level (debug/info/warn/error)
- `UPLOAD_LIMIT` - Max file upload size (default: 10MB)
- `DEFAULT_AI_PROVIDER` - Default provider (claude/openai/llama)
- `MAX_COST_PER_SESSION` - Budget limit in USD
- `RATE_LIMIT_REQUESTS_PER_MINUTE` - API rate limiting

## Testing

### Sample Data

The `sample-data/` directory contains test bookmark files from various browsers:

- `chrome-bookmarks.html` - Chrome export sample
- `firefox-bookmarks.html` - Firefox export sample
- `safari-bookmarks.html` - Safari export sample
- `large-collection.html` - 1000+ bookmark test file

### Running Tests

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

## Configuration

### AI Provider Setup

#### Claude (Recommended)
1. Get API key from [Anthropic Console](https://console.anthropic.com/)
2. Set `CLAUDE_API_KEY` in environment variables
3. Configure cost limits in web interface

#### OpenAI GPT-4
1. Get API key from [OpenAI Platform](https://platform.openai.com/)
2. Set `OPENAI_API_KEY` in environment variables
3. Monitor usage through OpenAI dashboard

#### Local Llama (Privacy-Focused)
1. Download model files to `models/` directory
2. Set `LLAMA_MODEL_PATH` environment variable
3. Requires additional RAM (8GB+ recommended)

### Database Configuration

The application uses PostgreSQL for persistent data and Redis for caching. Both are configured via Docker Compose for development.

For production deployment:
- Use managed database services
- Configure backup strategies
- Set up monitoring and alerting

## Cost Management

### Understanding Costs

- **Claude**: ~$0.01 per bookmark analysis
- **OpenAI GPT-4**: ~$0.02 per bookmark analysis
- **Local Llama**: Free after model download

### Cost Controls

- Set session budgets in web interface
- Preview costs before processing
- Selective processing by folder/bookmark
- Real-time cost tracking
- Automatic stops at budget limits

## Security & Privacy

### Data Handling

- All bookmark data processed locally
- Only summary requests sent to AI providers
- No persistent storage of sensitive content
- Automatic cleanup of temporary files

### API Key Security

- Environment variable storage
- No keys in source code or logs
- Secure container environment
- Option for local AI processing

## Deployment

### Development

```bash
docker-compose up -d
```

### Production

```bash
# Use production Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Or build custom images
docker build -t bookmarkparser-backend ./backend
docker build -t bookmarkparser-frontend ./frontend
```

### Environment Configuration

Ensure all required environment variables are set for production deployment. Use Docker secrets or external configuration management for sensitive values.

## Troubleshooting

### Common Issues

**Upload fails:**
- Check file size limits (`UPLOAD_LIMIT`)
- Verify file format (HTML bookmark export)
- Ensure sufficient disk space

**AI processing errors:**
- Verify API keys are valid
- Check rate limiting settings
- Monitor cost budgets

**Performance issues:**
- Increase Docker memory allocation
- Check database connection pool settings
- Monitor Redis memory usage

### Logging

Application logs are available through Docker:

```bash
# Backend logs
docker-compose logs backend

# Frontend logs
docker-compose logs frontend

# All services
docker-compose logs
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Development Guidelines

- Follow TypeScript strict mode
- Maintain 80%+ test coverage
- Use conventional commit messages
- Update documentation as needed

## License

[MIT License](LICENSE) - see LICENSE file for details.

## Roadmap

### MVP (Current)
- Multi-browser bookmark import
- Multi-AI provider support
- Cost control and tracking
- Web interface for management
- Docker deployment

## Support

- Documentation: Check the `docs/` directory
- Issues: Create GitHub issues for bugs
- Features: Submit feature requests

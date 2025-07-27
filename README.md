# BookmarkParser

A containerized web application that helps users organize and manage browser bookmark collections through a modern web interface.

## Overview

BookmarkParser helps users efficiently organize their bookmark collections through an intuitive web interface. Upload your browser bookmarks, review them in an organized display, and download a cleaned collection.

### Current Features

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

```
backend/
├── src/
│   ├── routes/        # Express route handlers
│   ├── services/      # Business logic layer
│   ├── parsers/       # Bookmark HTML parsing
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
sample-data/           # Sample bookmark files for testing
```

### Development Commands

```bash
# Start development environment
docker-compose up -d

# Backend development server (from backend/ directory)
cd backend && npm run dev

# Frontend development server (from frontend/ directory)
cd frontend && npm run dev

# Run tests
cd backend && npm run test
cd frontend && npm run test

# Code quality checks
cd backend && npm run lint && npm run typecheck
cd frontend && npm run lint && npm run typecheck

# Build for production
cd backend && npm run build
cd frontend && npm run build
```

### Technology Stack

**Backend:**
- Node.js 18+ with TypeScript
- Express.js web framework
- PostgreSQL database
- Redis for caching and sessions
- Cheerio for HTML parsing
- Multer for file uploads

**Frontend:**
- React 18+ with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Query for state management
- React Router for navigation
- Lucide icons

## Environment Variables

### Required

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string

### Optional

- `NODE_ENV` - Environment (development/production)
- `PORT` - Backend server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS
- `LOG_LEVEL` - Logging level (debug/info/warn/error)
- `UPLOAD_LIMIT` - Max file upload size (default: 10MB)

## Testing

### Sample Data

The `sample-data/` directory contains test bookmark files for development and testing.

### Running Tests

```bash
# Backend tests
cd backend && npm run test

# Frontend tests
cd frontend && npm run test

# Watch mode
cd backend && npm run test:watch
cd frontend && npm run test
```

## Configuration

### Database Configuration

The application uses PostgreSQL for persistent data and Redis for sessions and caching. Both are configured via Docker Compose for development.

For production deployment:
- Use managed database services
- Configure backup strategies
- Set up monitoring and alerting

## Security & Privacy

### Data Handling

- All bookmark data processed locally
- No external API calls for data processing
- Temporary file storage with automatic cleanup
- Session-based data management

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

### Current Implementation
- Multi-browser bookmark import
- Web interface for bookmark management
- Export functionality
- Docker deployment

### Planned Features
- AI-powered bookmark analysis and categorization
- Advanced search and filtering
- Bookmark deduplication
- Enhanced export options

## Support

- Documentation: Check the `docs/` directory
- Issues: Create GitHub issues for bugs
- Features: Submit feature requests

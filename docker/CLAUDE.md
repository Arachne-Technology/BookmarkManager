# Docker Configuration Guidelines - BookmarkParser

## Context
This directory contains Docker configuration files for the BookmarkParser application, including database initialization scripts, migration files, and production-ready containerization setup for a multi-service web application.

## Architecture Overview
BookmarkParser uses a multi-container Docker setup with the following services:
- **Frontend**: React app served via Nginx in production
- **Backend**: Node.js Express API server
- **Database**: PostgreSQL for persistent data storage
- **Cache**: Redis for session management and job queuing
- **Reverse Proxy**: Nginx for production load balancing (optional)

## File Structure
```
docker/
├── init-db.sql           # Database initialization script
├── migrations/           # Database schema migrations
│   └── 001_add_ai_fields.sql
├── nginx.conf           # Nginx configuration (production)
├── docker-compose.yml   # Production configuration
├── docker-compose.dev.yml # Development configuration
└── Dockerfile.prod      # Production multi-stage build
```

## Development Environment

### Docker Compose Development Setup
The development environment uses `docker-compose.dev.yml` for hot reloading and development-friendly configurations:

```yaml
# Key development features:
- Hot reload for frontend and backend code
- Volume mounts for source code
- Development database with seeded data
- Exposed ports for direct service access
- Development environment variables
```

### Development Commands
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs for all services
docker-compose -f docker-compose.dev.yml logs -f

# Restart specific service
docker-compose -f docker-compose.dev.yml restart backend

# Stop all services
docker-compose -f docker-compose.dev.yml down

# Rebuild and restart
docker-compose -f docker-compose.dev.yml up -d --build

# Access service shells
docker-compose -f docker-compose.dev.yml exec backend bash
docker-compose -f docker-compose.dev.yml exec postgres psql -U bookmarks_user -d bookmarks_db
```

### Development Service Configuration
- **Frontend**: Port 3000, hot reload enabled, volume mounted source
- **Backend**: Port 3001, nodemon for auto-restart, volume mounted source
- **PostgreSQL**: Port 5432, development database with sample data
- **Redis**: Port 6379, no persistence in development
- **Nginx**: Disabled in development, frontend served directly by Vite

## Production Environment

### Multi-stage Docker Builds
Production uses optimized multi-stage builds to minimize image size and improve security:

```dockerfile
# Frontend production build
FROM node:18-alpine AS frontend-build
# Build optimized React bundle

FROM nginx:alpine AS frontend-runtime
# Serve static files with Nginx

# Backend production build
FROM node:18-alpine AS backend-build
# Build TypeScript and install production dependencies

FROM node:18-alpine AS backend-runtime
# Run production Node.js server
```

### Production Commands
```bash
# Build production images
docker-compose -f docker-compose.yml build

# Start production environment
docker-compose -f docker-compose.yml up -d

# Scale backend services
docker-compose -f docker-compose.yml up -d --scale backend=3

# Monitor production logs
docker-compose -f docker-compose.yml logs -f --tail=100

# Health check all services
docker-compose -f docker-compose.yml ps

# Production database backup
docker-compose -f docker-compose.yml exec postgres pg_dump -U bookmarks_user bookmarks_db > backup.sql
```

## Database Configuration

### Initialization Script (`init-db.sql`)
Creates the initial database schema with proper permissions and indexes:

```sql
-- Key features:
- UUID primary keys for distributed systems
- Proper foreign key relationships
- Indexes for query optimization
- User permissions and security
- Initial seed data for development
```

### Migration System (`migrations/`)
Sequential SQL migration files for schema evolution:

```bash
# Migration naming convention:
001_initial_schema.sql
002_add_ai_fields.sql
003_add_indexes.sql

# Migrations are applied automatically during container startup
```

### Database Best Practices
- **Connection Pooling**: Configured for optimal performance
- **Health Checks**: Database readiness probes
- **Backup Strategy**: Automated backup configuration
- **Security**: Non-root database user with minimal permissions
- **Performance**: Proper indexing and query optimization

## Service Configuration

### Environment Variables
```bash
# Required for all environments
DATABASE_URL=postgresql://user:pass@postgres:5432/bookmarks_db
REDIS_URL=redis://redis:6379
NODE_ENV=production

# AI Provider Configuration
CLAUDE_API_KEY=your_claude_key
OPENAI_API_KEY=your_openai_key
DEFAULT_AI_PROVIDER=claude

# Security Settings
SESSION_SECRET=your_secure_session_secret
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX=100        # requests per window

# Performance Tuning
DATABASE_POOL_SIZE=20
REDIS_MAX_CONNECTIONS=50
UPLOAD_LIMIT=10mb
SESSION_TIMEOUT=3600
```

### Health Checks
All services include comprehensive health checks:

```yaml
# Backend health check
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s

# Database health check
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U bookmarks_user -d bookmarks_db"]
  interval: 10s
  timeout: 5s
  retries: 5
```

## Security Configuration

### Container Security
- **Non-root Users**: All services run as non-root users
- **Read-only Filesystems**: Where possible, containers use read-only filesystems
- **Secret Management**: API keys and secrets via environment variables or Docker secrets
- **Network Isolation**: Services communicate through dedicated Docker networks
- **Resource Limits**: CPU and memory limits to prevent resource exhaustion

### Production Security
```yaml
# Security-hardened configuration
security_opt:
  - no-new-privileges:true
read_only: true
tmpfs:
  - /tmp
cap_drop:
  - ALL
cap_add:
  - CHOWN
  - DAC_OVERRIDE
  - SETGID
  - SETUID
```

### SSL/TLS Configuration
```nginx
# Nginx SSL configuration
ssl_certificate /etc/ssl/certs/your-domain.crt;
ssl_certificate_key /etc/ssl/private/your-domain.key;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
```

## Performance Optimization

### Resource Allocation
```yaml
# Production resource limits
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
    reservations:
      cpus: '0.5'
      memory: 512M
```

### Caching Strategy
- **Redis**: Session storage and AI response caching
- **Nginx**: Static asset caching with proper headers
- **Database**: Query result caching and connection pooling
- **CDN**: Static asset delivery via CDN in production

### Monitoring Integration
```yaml
# Prometheus monitoring
- prometheus_multiproc_dir=/tmp
- ENABLE_METRICS=true
- METRICS_PORT=9090

# Logging configuration
- LOG_LEVEL=info
- LOG_FORMAT=json
- LOG_OUTPUT=stdout
```

## Troubleshooting Guide

### Common Issues
```bash
# Database connection issues
docker-compose exec postgres pg_isready -U bookmarks_user
docker-compose logs postgres

# Redis connection issues
docker-compose exec redis redis-cli ping
docker-compose logs redis

# Backend API issues
docker-compose exec backend npm run health-check
docker-compose logs backend --tail=50

# Frontend build issues
docker-compose exec frontend npm run build
docker-compose logs frontend
```

### Debug Mode
```bash
# Enable debug logging
export LOG_LEVEL=debug
docker-compose up -d

# Access service logs
docker-compose logs -f backend | grep ERROR
docker-compose logs -f postgres | grep FATAL

# Interactive debugging
docker-compose exec backend bash
docker-compose exec postgres psql -U bookmarks_user -d bookmarks_db
```

### Performance Monitoring
```bash
# Monitor resource usage
docker stats

# Check service health
docker-compose ps
curl http://localhost:3001/health

# Database performance
docker-compose exec postgres psql -U bookmarks_user -d bookmarks_db -c "SELECT * FROM pg_stat_activity;"
```

## Deployment Strategies

### Development Deployment
- **Hot Reload**: Code changes reflected immediately
- **Debug Mode**: Detailed logging and error reporting
- **Volume Mounts**: Source code mounted for live editing
- **Port Exposure**: Direct access to all services
- **Sample Data**: Pre-loaded test bookmarks and data

### Staging Deployment
- **Production Build**: Optimized builds with minification
- **Environment Parity**: Same configuration as production
- **SSL Testing**: Test SSL certificate configuration
- **Load Testing**: Performance testing with realistic data
- **Migration Testing**: Test database migrations

### Production Deployment
- **Zero Downtime**: Rolling updates with health checks
- **Auto Scaling**: Horizontal scaling based on load
- **Backup Strategy**: Automated database and file backups
- **Monitoring**: Comprehensive logging and metrics
- **Security**: Full security hardening and regular updates

## Maintenance Tasks

### Regular Maintenance
```bash
# Database maintenance
docker-compose exec postgres vacuumdb -U bookmarks_user -d bookmarks_db

# Log rotation
docker system prune -f
docker volume prune -f

# Security updates
docker-compose pull
docker-compose up -d --build

# Backup creation
docker-compose exec postgres pg_dump -U bookmarks_user bookmarks_db > backup_$(date +%Y%m%d).sql
```

### Monitoring Commands
```bash
# Check disk usage
docker system df

# Monitor logs
docker-compose logs -f --tail=100

# Performance metrics
docker stats --no-stream

# Health status
docker-compose ps
curl -f http://localhost:3001/health || echo "Backend unhealthy"
```

## Important Notes
- Always use Docker Compose for local development to maintain environment parity
- Production containers should run as non-root users for security
- Use multi-stage builds to minimize production image sizes
- Implement proper health checks for all services
- Use Docker secrets or encrypted environment variables for sensitive data
- Regular security updates and vulnerability scanning for base images
- Monitor resource usage and set appropriate limits
- Implement proper logging and monitoring for production deployments
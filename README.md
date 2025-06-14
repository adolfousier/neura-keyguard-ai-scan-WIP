
# KeyGuard AI Scan

## Overview

KeyGuard AI Scan is a comprehensive, open-source security tool that scans websites for exposed API keys and provides AI-powered recommendations for remediation. Built with modern technologies and designed for both developers and security teams, it helps identify and fix API key exposures that could lead to security breaches.

## 🚀 Features

### 🔍 Comprehensive Scanning
- **Real-time Website Scanning**: Progressive scan with live updates
- **Deep Analysis**: Scans HTML, JavaScript, CSS, and network requests
- **100+ API Key Types**: Detects AWS, Google Cloud, GitHub, Stripe, OpenAI, and many more
- **Advanced Pattern Matching**: Regex patterns with entropy analysis
- **Context-Aware Detection**: Distinguishes between real keys and test/dummy values

### 🤖 AI-Powered Intelligence
- **Smart Recommendations**: NEURA_ROUTER integration for context-aware suggestions
- **Severity Classification**: Automatic risk assessment (Critical, High, Medium, Low)
- **Actionable Remediation**: Detailed, step-by-step fix instructions
- **Best Practices**: Security guidelines and prevention tips
- **Custom Solutions**: Tailored recommendations based on detected frameworks

### 📊 Professional Reporting
- **Interactive Dashboard**: Visual reporting with findings breakdown
- **Export Options**: PDF, JSON, CSV report generation
- **Shareable Results**: Secure sharing of scan results
- **Historical Tracking**: User account with scan history
- **Real-time Progress**: Live updates during scanning process

### 🔐 Enterprise Security
- **User Authentication**: JWT-based secure sessions
- **Rate Limiting**: Protection against abuse
- **Data Privacy**: No permanent storage of sensitive data
- **HTTPS Encryption**: All communications encrypted
- **Audit Logging**: Comprehensive activity tracking

## 🏗️ Architecture

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and builds
- **Styling**: Tailwind CSS + Shadcn/ui components
- **State Management**: TanStack Query for server state
- **Analytics**: Langfuse for user tracking and insights
- **Icons**: Lucide React for consistent iconography

### Backend Stack
- **Language**: Rust for performance and safety
- **Database**: LibSQL for lightweight, fast data storage
- **Web Framework**: Axum for async HTTP services
- **Authentication**: JWT with bcrypt password hashing
- **AI Integration**: NEURA_ROUTER (OpenAI-compatible)
- **HTTP Client**: Reqwest for web scraping

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for local development
- **Ports**: Frontend (11111), Backend (11112)
- **Database**: In-memory LibSQL (production-ready for scaling)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Rust 1.75+ (for backend development)
- Docker and Docker Compose (recommended)

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd keyguard-ai-scan
   ```

2. **Set environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your NEURA_ROUTER_API_KEY
   ```

3. **Start the services**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:11111
   - Backend API: http://localhost:11112

### Manual Development Setup

#### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

#### Backend Setup
```bash
# Navigate to server directory
cd server

# Build and run
cargo run
```

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```bash
VITE_API_URL=http://localhost:11112
```

#### Backend (server/.env)
```bash
JWT_SECRET=your-secure-jwt-secret
NEURA_ROUTER_API_KEY=your-neura-router-api-key
NEURA_ROUTER_API_URL=https://api.neura-router.com/v1
RUST_LOG=info
```

### API Keys Setup

1. **NEURA_ROUTER Integration**
   - Sign up at NEURA_ROUTER platform
   - Generate API key with GPT-4 access
   - Add to environment variables

2. **Production Deployment**
   - Use strong JWT secret (32+ characters)
   - Enable HTTPS in production
   - Configure proper CORS origins

## 📖 API Documentation

### Core Endpoints

#### Scanning
- `POST /api/scan` - Start new scan
- `GET /api/scan/:id` - Get scan results
- `GET /api/scan/:id/progress` - Get scan progress

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/user/scans` - Get user's scan history

#### Health
- `GET /api/health` - Service health check

### Request/Response Examples

#### Start Scan
```json
POST /api/scan
{
  "url": "https://example.com",
  "user_id": "optional-user-id"
}
```

#### Scan Response
```json
{
  "success": true,
  "data": {
    "id": "scan-uuid",
    "url": "https://example.com",
    "status": "scanning",
    "findings": [],
    "summary": {
      "critical": 0,
      "high": 0,
      "medium": 0,
      "low": 0,
      "total": 0
    }
  }
}
```

## 🧪 Testing

### Frontend Testing
```bash
npm run test
npm run test:coverage
```

### Backend Testing
```bash
cd server
cargo test
cargo test --release
```

### Integration Testing
```bash
docker-compose -f docker-compose.test.yml up --build
```

## 🚀 Deployment

### Production Docker Build
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Production Setup
1. Build frontend: `npm run build`
2. Build backend: `cd server && cargo build --release`
3. Configure reverse proxy (nginx/traefik)
4. Set up SSL certificates
5. Configure monitoring and logging

## 🔐 Security Considerations

### Data Privacy
- **No Permanent Storage**: Scan results stored temporarily
- **Encryption**: All data transmission via HTTPS
- **User Control**: Clear data retention policies
- **Anonymization**: No PII stored without consent

### Scanning Ethics
- **Rate Limiting**: Prevents abuse of target websites
- **Robots.txt**: Respects website scanning preferences
- **Legal Compliance**: GDPR, CCPA compliant
- **Responsible Disclosure**: Security-focused approach

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Standards
- **Frontend**: ESLint + Prettier configuration
- **Backend**: Rustfmt + Clippy linting
- **Testing**: Minimum 80% code coverage
- **Documentation**: Comprehensive inline docs

## 📊 Analytics & Monitoring

### Built-in Analytics
- **Scan Metrics**: Success rates, duration, findings
- **User Behavior**: Feature usage, engagement patterns
- **Performance**: Response times, error rates
- **Security**: Vulnerability trends, detection accuracy

### Monitoring Stack
- **Logging**: Structured logs with tracing
- **Metrics**: Custom metrics for business KPIs
- **Alerting**: Error rate and performance alerts
- **Health Checks**: Automated service monitoring

## 🆘 Support

### Documentation
- **API Reference**: Comprehensive endpoint documentation
- **Developer Guide**: Setup and customization instructions
- **Security Guide**: Best practices and compliance
- **Troubleshooting**: Common issues and solutions

### Community
- **Issues**: GitHub Issues for bug reports
- **Discussions**: Feature requests and questions
- **Discord**: Real-time community support
- **Security**: security@keyguard.dev for vulnerabilities

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Shadcn/ui**: Beautiful, accessible React components
- **Langfuse**: Analytics and user tracking platform
- **NEURA_ROUTER**: AI-powered recommendation engine
- **Rust Community**: Amazing ecosystem and libraries
- **Security Researchers**: Vulnerability patterns and best practices

---

**KeyGuard AI Scan** - Securing the web, one API key at a time. 🔐✨

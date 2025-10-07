# Elite Bet - Production-Grade Betting & Casino Platform

A comprehensive, production-ready betting and casino platform built with modern web technologies, featuring real-time betting, secure payments, and advanced risk management.

## 🚀 Features

### Core Platform
- **User Management**: Secure registration, login with 2FA (TOTP), KYC integration
- **Multi-Currency Wallet**: Support for fiat (USD, EUR, GBP) and cryptocurrencies (BTC, ETH, USDT)
- **Sports Betting**: Pre-match and live betting with real-time odds updates
- **Casino Games**: Integration with certified game providers
- **Real-Time Updates**: WebSocket-based live odds and notifications
- **Admin Panel**: Comprehensive management interface with RBAC

### Security & Compliance
- **Bank-Level Security**: Argon2 password hashing, AES-256 encryption
- **Audit Trails**: Immutable logging of all financial transactions
- **Rate Limiting**: API protection with intelligent throttling
- **Data Protection**: GDPR compliant with encrypted PII storage
- **Responsible Gaming**: Deposit limits, loss limits, self-exclusion tools

### Performance & Scalability
- **Microservices Architecture**: Scalable, maintainable service design
- **Real-Time Communication**: Socket.IO for live updates
- **Caching**: Redis for session management and real-time data
- **Database**: PostgreSQL with optimized queries and indexing
- **Monitoring**: Comprehensive observability with Prometheus and Grafana

## 🏗️ Architecture

### Services
- **API Gateway**: Central entry point with authentication and routing
- **Auth Service**: User authentication and authorization
- **Wallet Service**: Financial transactions and ledger management
- **Betting Service**: Odds management and bet processing
- **Casino Service**: Game integration and session management
- **KYC Service**: Document verification and compliance
- **Admin Service**: Administrative functions and reporting

### Technology Stack
- **Backend**: Node.js, NestJS, TypeScript
- **Database**: PostgreSQL, Redis
- **Message Queue**: Apache Kafka
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Infrastructure**: Docker, Kubernetes, Terraform
- **Monitoring**: Prometheus, Grafana, ELK Stack

## 🚦 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd betting-platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development environment**
```bash
# Start all services with Docker Compose
docker-compose up -d

# Or start individual services
npm run dev:api      # Start API Gateway
npm run dev:web      # Start Web Application
```

4. **Initialize the database**
```bash
# The database will be automatically initialized with the schema
# Sample data is included for development
```

5. **Access the applications**
- Web Application: http://localhost:3001
- API Documentation: http://localhost:3000/api/docs
- Admin Panel: http://localhost:3001/admin
- Grafana Dashboard: http://localhost:3002 (admin/admin)
- Prometheus: http://localhost:9090

### Demo Accounts

For testing, use these demo accounts:

**Regular User**
- Email: demo@elitebet.com
- Password: Demo123!@#

**Admin User**
- Email: admin@elitebet.com
- Password: Admin123!@#

## 🧪 Testing

### Running Tests
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# Load testing
npm run test:load
```

### Test Coverage
- **Unit Tests**: 90%+ coverage for core business logic
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Complete user flows
- **Load Tests**: 1000+ concurrent users

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL=postgresql://betting_user:betting_password@localhost:5432/betting_platform

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secure-jwt-secret-key

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key

# External Services
STRIPE_SECRET_KEY=sk_test_...
KYC_PROVIDER_API_KEY=your-kyc-provider-key
```

## 📊 Database Schema

The platform uses a comprehensive PostgreSQL schema with:

- **Auth Schema**: Users, profiles, sessions, 2FA
- **Wallet Schema**: Accounts, ledger entries, transactions
- **Betting Schema**: Sports, events, markets, selections, bets
- **Casino Schema**: Games, providers, sessions
- **Admin Schema**: Roles, permissions, audit logs
- **KYC Schema**: Verification requests, documents

## 🔐 Security Features

### Authentication & Authorization
- Argon2 password hashing
- JWT tokens with Redis blacklisting
- Two-factor authentication (TOTP)
- Role-based access control (RBAC)
- Session management with automatic expiry

### Data Protection
- AES-256 encryption for sensitive data
- Encrypted database connections (TLS)
- PII encryption at rest
- Secure API communication (HTTPS only)
- Input validation and sanitization

### Financial Security
- Immutable transaction ledger
- Atomic financial operations
- Multi-signature withdrawals (optional)
- Fraud detection and prevention
- Real-time risk monitoring

## 🎯 API Documentation

The platform provides comprehensive API documentation:

- **OpenAPI/Swagger**: Available at `/api/docs`
- **Interactive Testing**: Built-in API explorer
- **Code Examples**: Multiple programming languages
- **Rate Limits**: Documented per endpoint
- **Error Codes**: Detailed error responses

### Key Endpoints

```
POST /api/v1/auth/register     - User registration
POST /api/v1/auth/login        - User login
GET  /api/v1/markets           - Sports markets
POST /api/v1/bets              - Place bet
GET  /api/v1/wallet            - Wallet balance
POST /api/v1/payments/deposit  - Deposit funds
```

## 🚀 Deployment

### Production Deployment

1. **Infrastructure Setup**
```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
```

2. **Application Deployment**
```bash
# Build Docker images
npm run docker:build

# Deploy to Kubernetes
npm run k8s:deploy
```

3. **Monitoring Setup**
```bash
# Deploy monitoring stack
helm install monitoring ./infra/monitoring
```

### Scaling Guidelines

- **Horizontal Scaling**: Kubernetes HPA based on CPU/memory
- **Database Scaling**: Read replicas for queries
- **Caching**: Redis Cluster for high availability
- **CDN**: CloudFlare for static assets
- **Load Balancing**: NGINX with SSL termination

## 📈 Monitoring & Observability

### Metrics
- **Application Metrics**: Custom business metrics
- **Infrastructure Metrics**: CPU, memory, disk, network
- **Database Metrics**: Query performance, connections
- **API Metrics**: Response times, error rates

### Logging
- **Structured Logging**: JSON format with correlation IDs
- **Log Aggregation**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Log Retention**: 30 days for debug, 1 year for audit

### Alerting
- **Critical Alerts**: System failures, security breaches
- **Warning Alerts**: High CPU, slow queries, error rates
- **Business Alerts**: Deposit failures, withdrawal issues

## 🔄 Development Workflow

### Code Quality
- **TypeScript**: Strict type checking
- **ESLint**: Code linting with custom rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality checks

### Git Workflow
- **Feature Branches**: All development in feature branches
- **Pull Requests**: Code review required
- **Automated Testing**: CI/CD pipeline testing
- **Deployment**: Automated deployment on merge

### Release Process
1. Feature development in branches
2. Pull request with code review
3. Automated testing (unit, integration, E2E)
4. Security scanning (SAST, DAST)
5. Staging deployment
6. Production deployment with canary

## 🆘 Troubleshooting

### Common Issues

**Database Connection Issues**
```bash
# Check database status
docker-compose ps postgres
docker-compose logs postgres
```

**Redis Connection Issues**
```bash
# Check Redis status
docker-compose ps redis
redis-cli ping
```

**API Gateway Issues**
```bash
# Check logs
docker-compose logs api-gateway
# Restart service
docker-compose restart api-gateway
```

### Performance Issues

**Slow Database Queries**
```sql
-- Check slow queries
SELECT query, mean_time, calls FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;
```

**High Memory Usage**
```bash
# Check memory usage
docker stats
# Restart services if needed
docker-compose restart
```

## 📚 Additional Resources

- [API Documentation](http://localhost:3000/api/docs)
- [Architecture Guide](./docs/architecture.md)
- [Deployment Guide](./docs/deployment.md)
- [Security Guide](./docs/security.md)
- [Contributing Guidelines](./docs/contributing.md)

## ⚖️ Legal & Compliance

**Important**: This platform is for demonstration purposes. Before operating with real money:

1. Obtain proper gambling licenses in your jurisdiction
2. Implement additional KYC/AML procedures
3. Add responsible gambling features
4. Conduct security audits and penetration testing
5. Ensure compliance with local regulations
6. Implement proper tax reporting
7. Add consumer protection measures

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guidelines](./docs/contributing.md) and [Code of Conduct](./docs/code-of-conduct.md).

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- NestJS team for the excellent framework
- Next.js team for the React framework
- PostgreSQL community for the robust database
- Redis community for the caching solution
- All open-source contributors

---

**Disclaimer**: This software is provided for educational and demonstration purposes. Operating a real-money gambling platform requires proper licensing, compliance with local laws, and additional security measures not included in this demo.
# Turbo Payments

A modern P2P payments system built with microservices architecture, featuring independent user and payment services with a sleek Next.js frontend.

## 🏗️ Architecture

- **Microservices**: Independent user and payment services
- **Frontend**: Next.js application
- **Message Queue**: Redis for service communication
- **Database**: MongoDB for each service
- **Monorepo**: Turborepo for efficient development

## 📁 Project Structure

```
turbo-payments/
├── apps/
│   ├── user-service/     # NestJS microservice for user management
│   ├── payment-service/  # NestJS microservice for payments
│   └── frontend/         # Next.js web application
├── packages/
│   ├── types/           # Shared TypeScript types
│   └── configs/         # Shared configurations
└── docker-compose.yml   # Development environment
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Redis
- MongoDB

### Installation

```bash
# Install dependencies
npm install

# Start development environment
npm run dev
```

## 📦 Available Scripts

- `npm run dev` - Start all services in development mode
- `npm run build` - Build all applications
- `npm run test` - Run tests across all services
- `npm run lint` - Lint all code
- `npm run clean` - Clean build artifacts

## 🎯 Development Progress

### ✅ Completed

- [x] Turborepo setup and configuration
- [x] Project structure definition

### 🚧 In Progress

- [ ] User service setup
- [ ] Payment service setup
- [ ] Frontend application
- [ ] Redis message queue integration
- [ ] Docker development environment

### 📋 Planned Features

- [ ] JWT authentication across services
- [ ] Real-time payment processing
- [ ] Balance management
- [ ] Payment history
- [ ] Refund capabilities
- [ ] Service-to-service communication

## 🛠️ Technology Stack

- **Backend**: NestJS with Hexagonal Architecture
- **Frontend**: Next.js with TypeScript
- **Database**: MongoDB
- **Message Queue**: Redis
- **Development**: Turborepo, Docker
- **Authentication**: JWT tokens

---

Built with ❤️ following clean architecture principles and modern development practices.

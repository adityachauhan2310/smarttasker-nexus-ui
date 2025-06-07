# SmartTasker Setup Guide

This guide will help you set up the SmartTasker application from scratch. Follow each step carefully to ensure a successful installation.

## Prerequisites

- Node.js v16+
- npm or yarn
- Docker and Docker Compose (recommended)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smarttasker-nexus-ui
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start MongoDB and Redis using Docker**
   ```bash
   docker-compose up -d
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

5. **Initialize the database structure**
   ```bash
   npm run init-db
   ```

6. **Create your admin user**
   ```bash
   npm run create-admin
   ```

7. **Start the application**
   ```bash
   # Terminal 1 - Frontend
   npm run dev
   
   # Terminal 2 - Backend
   npm run server:dev
   ```

8. **Access the application**
   - Frontend: http://localhost:5173
   - API: http://localhost:5000/api
   - API Docs: http://localhost:5000/api/docs

## Detailed Setup Instructions

### Docker Setup

The provided `docker-compose.yml` file sets up:

- **MongoDB** (port 27017)
- **Mongo Express** - MongoDB web interface (http://localhost:8081)
- **Redis** (port 6379)
- **Redis Commander** - Redis web interface (http://localhost:8082)

Access Mongo Express with:
- Username: `admin`
- Password: `password`

### Database Setup

The SmartTasker application requires several collections to be initialized:

1. **Initialize database structure**: 
   ```bash
   npm run init-db
   ```

2. **Create an admin user**: 
   ```bash
   npm run create-admin
   ```
   
   You'll be prompted to enter:
   - Admin name
   - Admin email
   - Admin password (min 6 characters)

### Environment Variables

The essential environment variables are:

```
# Server
NODE_ENV=development
PORT=5000

# MongoDB
MONGO_URI=mongodb://admin:password@localhost:27017/smarttasker?authSource=admin

# Auth
JWT_SECRET=your_jwt_secret_key_change_me
JWT_EXPIRE=1d
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_change_me
JWT_REFRESH_EXPIRE=7d
COOKIE_SECRET=your_cookie_secret_key_change_me

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8080

# Redis (optional but recommended)
ENABLE_REDIS=true
REDIS_URL=redis://localhost:6379
```

For full configuration options, see the `.env.example` file.

### Starting the Application

1. **Start the frontend development server**:
   ```bash
   npm run dev
   ```

2. **Start the backend server** (in a separate terminal):
   ```bash
   npm run server:dev
   ```

## Alternative Setups

### Using Local MongoDB (Without Docker)

1. **Install MongoDB** following the [official documentation](https://www.mongodb.com/docs/manual/installation/)

2. **Update your .env file** with local MongoDB connection:
   ```
   MONGO_URI=mongodb://localhost:27017/smarttasker
   ```

3. **Continue with database initialization** as described above

### Using MongoDB Atlas (Cloud)

1. **Create a MongoDB Atlas account** at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

2. **Create a cluster** and get your connection string

3. **Update your .env file** with Atlas connection:
   ```
   MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/smarttasker?retryWrites=true&w=majority
   ```

4. **Continue with database initialization** as described above

## Troubleshooting

### Docker Issues

- Ensure Docker Desktop is running
- Check if ports 27017, 8081, 6379, 8082 are already in use
- Run `docker ps` to verify containers are running

### MongoDB Connection Issues

- Verify MongoDB is running: `docker ps | grep mongodb`
- Check your connection string in the `.env` file
- Try accessing Mongo Express at http://localhost:8081

### API Connection Issues

- Ensure backend server is running
- Check CORS settings if frontend can't connect
- Verify API URL matches in both frontend and backend

## Production Deployment

1. **Build the frontend**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm run server
   ```

3. **Configure environment variables** appropriate for production:
   - Set `NODE_ENV=production`
   - Use secure secrets for JWT and cookies
   - Configure proper CORS settings 
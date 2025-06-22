#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import chalk from 'chalk';
import http from 'http';
import { setTimeout } from 'timers/promises';

// Function to check if docker is running
function isDockerRunning() {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Function to log with timestamp
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = chalk.gray(`[${timestamp}]`);
  
  switch (type) {
    case 'error':
      console.log(`${prefix} ${chalk.red(message)}`);
      break;
    case 'success':
      console.log(`${prefix} ${chalk.green(message)}`);
      break;
    case 'warning':
      console.log(`${prefix} ${chalk.yellow(message)}`);
      break;
    default:
      console.log(`${prefix} ${chalk.blue(message)}`);
  }
}

// Function to check if a service is ready on a given port
async function checkServiceReady(port, host = 'localhost', maxRetries = 10, retryDelay = 1000) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.request({
          method: 'HEAD',
          host,
          port,
          timeout: 1000,
        }, (res) => {
          resolve(res.statusCode < 500); // Consider any non-5xx response as "ready"
        });
        
        req.on('error', () => reject());
        req.end();
      });
      
      return true;
    } catch (error) {
      retries++;
      log(`Service on port ${port} not ready, retrying (${retries}/${maxRetries})...`, 'warning');
      await setTimeout(retryDelay);
    }
  }
  
  return false;
}

// Function to monitor and restart backend if it crashes
async function monitorBackend(backendProcess) {
  let consecutiveFailures = 0;
  const maxConsecutiveFailures = 3;
  let lastRestartTime = 0;
  
  // Monitor backend health every 10 seconds
  const healthCheckInterval = setInterval(async () => {
    try {
      // Try to access health endpoint
      const isHealthy = await checkServiceReady(5000, 'localhost', 1);
      
      const now = Date.now();
      const timeSinceLastRestart = now - lastRestartTime;
      
      if (isHealthy) {
        // Reset failure counter when service is healthy
        consecutiveFailures = 0;
      } else if (!backendProcess.killed) {
        consecutiveFailures++;
        log(`Backend server is not responding (failure ${consecutiveFailures}/${maxConsecutiveFailures})`, 'warning');
        
        // Only restart if we haven't exceeded max failures and last restart was at least 30 seconds ago
        if (consecutiveFailures <= maxConsecutiveFailures && timeSinceLastRestart > 30000) {
          log('Attempting to restart backend server...', 'error');
          
          // Kill the existing process if it's stuck
          try {
            backendProcess.kill();
            await setTimeout(2000);
          } catch (killError) {
            // Ignore kill errors
          }
          
          // Start a new backend process
          const newBackendProcess = spawn('npm', ['run', 'server:dev'], { 
            stdio: 'inherit',
            shell: true
          });
          
          // Update the reference to the new process
          backendProcess = newBackendProcess;
          lastRestartTime = now;
          log('Backend server restarted', 'success');
        } else if (consecutiveFailures > maxConsecutiveFailures) {
          log('Too many consecutive failures. Please check server logs and restart manually.', 'error');
          clearInterval(healthCheckInterval);
        }
      }
    } catch (error) {
      log(`Health check error: ${error.message}`, 'error');
    }
  }, 10000);
  
  return backendProcess;
}

// Main function to start the development environment
async function startDev() {
  // Check if Docker is running
  if (!isDockerRunning()) {
    log('Docker is not running! Please start Docker and try again.', 'error');
    process.exit(1);
  }

  // Check if containers are running and start them if not
  log('Checking Docker containers...');
  try {
    const containersRunning = execSync('docker ps -q --filter name=smarttasker').toString();
    
    if (!containersRunning) {
      log('Starting Docker containers...', 'warning');
      execSync('docker-compose up -d', { stdio: 'inherit' });
      
      // Give containers time to initialize
      log('Waiting for containers to initialize...', 'warning');
      await setTimeout(5000);
    } else {
      log('Docker containers are already running', 'success');
    }
    
    // Verify Redis is reachable
    log('Verifying Redis container is healthy...');
    let redisReady = false;
    
    try {
      // Try to connect to Redis Commander UI which indicates Redis is working
      redisReady = await checkServiceReady(8082);
      
      if (redisReady) {
        log('Redis is ready!', 'success');
      } else {
        log('Redis container might not be fully ready. Continuing anyway...', 'warning');
        // Try to restart Redis container if it's not ready
        log('Attempting to restart Redis container...', 'warning');
        execSync('docker restart smarttasker-redis', { stdio: 'ignore' });
        await setTimeout(5000);
      }
    } catch (error) {
      log('Could not verify Redis health. Continuing anyway...', 'warning');
    }
  } catch (error) {
    log(`Error with Docker containers: ${error.message}`, 'error');
    process.exit(1);
  }

  // Start backend server
  log('Starting backend server...');
  let backendProcess = spawn('npm', ['run', 'server:dev'], { 
    stdio: 'inherit',
    shell: true
  });
  
  // Wait a bit for the backend to initialize before starting frontend
  await setTimeout(5000);
  
  // Setup backend monitoring with auto-restart
  backendProcess = await monitorBackend(backendProcess);

  // Start frontend development server
  log('Starting frontend development server...');
  const frontendProcess = spawn('npm', ['run', 'dev'], { 
    stdio: 'inherit',
    shell: true
  });
  
  // Display useful information
  log('---------------------------------------------', 'success');
  log('🚀 Development environment is running!', 'success');
  log('🔄 Redis Commander UI: http://localhost:8082', 'success');
  log('🖥️ Frontend: http://localhost:8080', 'success');
  log('⚙️ Backend API: http://localhost:5000', 'success');
  log('---------------------------------------------', 'success');
  log('📝 Admin credentials:', 'success');
  log('   Email: admin@smarttasker.ai', 'success');
  log('   Password: Admin@123', 'success');
  log('---------------------------------------------', 'success');

  // Handle process termination
  const cleanup = () => {
    log('Shutting down servers...', 'warning');
    backendProcess.kill();
    frontendProcess.kill();
    process.exit(0);
  };

  // Listen for termination signals
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

// Run the main function
startDev().catch(error => {
  log(`Error: ${error.message}`, 'error');
  process.exit(1);
}); 
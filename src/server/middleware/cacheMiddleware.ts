import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';
import config from '../config/config';

let redisClient: ReturnType<typeof createClient> | null = null;

// Initialize Redis client if enabled
if (config.enableRedis) {
  redisClient = createClient({
    url: config.redisUrl
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.connect().catch(console.error);
  console.log('Redis cache client initialized');
}

/**
 * Generate a cache key based on the request
 * @param req - Express request object
 * @param prefix - Prefix for the cache key
 * @returns - Cache key string
 */
function generateCacheKey(req: Request, prefix: string): string {
  // Base key includes prefix, path, and user role (for role-based data)
  let key = `${prefix}:${req.originalUrl}`;

  // Add user-specific identifier for personalized data
  if (req.user) {
    if (req.user.role !== 'admin') {
      // For non-admins, make cache key user-specific
      key += `:${req.user._id}`;
    } else {
      // For admins, just add role to differentiate from other roles' cache
      key += ':admin';
    }
  }

  return key;
}

/**
 * Middleware for caching responses
 * @param prefix - Prefix for the cache key
 * @param expireTime - Cache expiration time in seconds
 */
export const cacheMiddleware = (prefix: string, expireTime: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip cache if Redis is not enabled
    if (!config.enableRedis || !redisClient) {
      return next();
    }

    try {
      // Skip cache for non-GET requests
      if (req.method !== 'GET') {
        return next();
      }

      // Create a cache key based on the request
      const cacheKey = generateCacheKey(req, prefix);

      // Check if data exists in cache
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        // Data found in cache, return it
        return res.status(200).json(JSON.parse(cachedData));
      }

      // No cache hit, capture the response
      const originalSend = res.send;
      res.send = function (body: any): Response {
        // Only cache successful responses
        if (res.statusCode === 200) {
          // Store response in cache
          if (body) {
            redisClient?.set(cacheKey, body, {
              EX: expireTime,
            }).catch((err) => {
              console.error('Redis cache set error:', err);
            });
          }
        }

        // Send the original response
        return originalSend.call(this, body);
      } as any;

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next(); // Continue without caching
    }
  };
};

/**
 * Alias for cacheMiddleware to be used in routes
 * @param expireTime - Cache expiration time in seconds
 */
export const cacheResponse = (expireTime: number = 300) => {
  return cacheMiddleware('response', expireTime);
};

/**
 * Task-specific cache clearing middleware
 */
export const taskCacheClearer = async (req: Request, res: Response, next: NextFunction) => {
  // Store the original end function
  const originalEnd = res.end;
  
  // Override the end function
  res.end = function(chunk?: any, encoding?: BufferEncoding, callback?: () => void): Response {
    // Only clear cache for successful operations
    if (res.statusCode >= 200 && res.statusCode < 300) {
      clearEntityCache('task').catch(console.error);
    }
    
    // Call the original end function
    return originalEnd.call(this, chunk, encoding, callback);
  } as any;
  
  next();
};

/**
 * Clear cache for a specific prefix
 * @param prefix - Prefix to clear
 */
export const clearCache = async (prefix: string): Promise<void> => {
  if (!config.enableRedis || !redisClient || !redisClient.isOpen) {
    return;
  }

  try {
    // Get all keys matching the pattern
    const keys = await redisClient.keys(`${prefix}:*`);
    
    if (keys.length > 0) {
      // Delete all matching keys
      await redisClient.del(keys);
      console.log(`Cleared ${keys.length} cache entries with prefix: ${prefix}`);
    }
  } catch (error) {
    console.error('Clear cache error:', error);
  }
};

/**
 * Clear all cache entries related to a specific entity
 * Used when entities are created, updated or deleted
 * @param entityType - Type of entity (e.g., 'user', 'team', 'task')
 */
export const clearEntityCache = async (entityType: string): Promise<void> => {
  if (!config.enableRedis || !redisClient) {
    return;
  }
  
  const prefixesToClear: string[] = [];
  
  // Add entity-specific prefixes
  switch (entityType) {
    case 'team':
      prefixesToClear.push('team', 'teams', 'teamMembers');
      break;
    case 'user':
      prefixesToClear.push('user', 'users', 'teamMembers');
      break;
    case 'task':
      prefixesToClear.push('task', 'tasks', 'teamTasks');
      break;
    default:
      break;
  }
  
  // Clear all related caches
  for (const prefix of prefixesToClear) {
    await clearCache(prefix);
  }
};

export default {
  cacheMiddleware,
  clearCache,
  clearEntityCache,
}; 
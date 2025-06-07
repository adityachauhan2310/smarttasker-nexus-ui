import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SmartTasker API',
      version: '1.0.0',
      description: 'API documentation for SmartTasker - AI-powered task management platform',
      contact: {
        name: 'SmartTasker Support',
        url: 'https://smarttasker.app/support',
        email: 'support@smarttasker.app'
      },
      license: {
        name: 'Private',
        url: 'https://smarttasker.app/terms',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'Development server',
      },
      {
        url: 'https://api.smarttasker.app/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT Bearer token **_only_**',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
          description: 'Cookie-based authentication',
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Not authorized' },
                },
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Resource not found' },
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  errors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        value: { type: 'string' },
                        msg: { type: 'string' },
                        param: { type: 'string' },
                        location: { type: 'string' },
                      },
                    },
                    example: [
                      {
                        value: '',
                        msg: 'Email is required',
                        param: 'email',
                        location: 'body',
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        TooManyRequestsError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { 
                    type: 'string', 
                    example: 'Too many requests, please try again later' 
                  },
                },
              },
            },
          },
        },
        InternalServerError: {
          description: 'Server error occurred',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Server Error' },
                },
              },
            },
          },
        },
      },
      schemas: {
        // User schemas
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', format: 'ObjectId' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['user', 'team_lead', 'admin'] },
            avatar: { type: 'string', nullable: true },
            teams: { 
              type: 'array',
              items: { type: 'string', format: 'ObjectId' },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        UserProfile: {
          type: 'object',
          properties: {
            _id: { type: 'string', format: 'ObjectId' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['user', 'team_lead', 'admin'] },
            avatar: { type: 'string', nullable: true },
          },
        },
        // Task schemas
        Task: {
          type: 'object',
          properties: {
            _id: { type: 'string', format: 'ObjectId' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            status: { 
              type: 'string', 
              enum: ['pending', 'in_progress', 'completed', 'cancelled', 'overdue'] 
            },
            priority: { 
              type: 'string', 
              enum: ['low', 'medium', 'high', 'urgent'] 
            },
            assignedTo: { 
              type: 'string', 
              format: 'ObjectId', 
              nullable: true 
            },
            assignedBy: { 
              type: 'string', 
              format: 'ObjectId', 
              nullable: true 
            },
            team: { 
              type: 'string', 
              format: 'ObjectId', 
              nullable: true 
            },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
            completedAt: { type: 'string', format: 'date-time', nullable: true },
            tags: { type: 'array', items: { type: 'string' } },
            attachments: { 
              type: 'array', 
              items: { 
                type: 'object',
                properties: {
                  filename: { type: 'string' },
                  path: { type: 'string' },
                  mimetype: { type: 'string' },
                  size: { type: 'number' },
                } 
              } 
            },
            comments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  user: { type: 'string', format: 'ObjectId' },
                  createdAt: { type: 'string', format: 'date-time' },
                }
              }
            },
            recurringTaskId: { type: 'string', format: 'ObjectId', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Team schemas
        Team: {
          type: 'object',
          properties: {
            _id: { type: 'string', format: 'ObjectId' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            leader: { type: 'string', format: 'ObjectId' },
            members: { 
              type: 'array',
              items: { type: 'string', format: 'ObjectId' },
            },
            avatar: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Analytics schemas
        AnalyticsData: {
          type: 'object',
          properties: {
            _id: { type: 'string', format: 'ObjectId' },
            user: { type: 'string', format: 'ObjectId', nullable: true },
            team: { type: 'string', format: 'ObjectId', nullable: true },
            type: { type: 'string', enum: ['user', 'team', 'system'] },
            category: { 
              type: 'string', 
              enum: ['tasks', 'performance', 'productivity', 'engagement', 'workload', 'trends'] 
            },
            metrics: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  value: { type: 'number' },
                  unit: { type: 'string', nullable: true },
                  metadata: { 
                    type: 'object',
                    additionalProperties: true,
                    nullable: true
                  }
                }
              }
            },
            timeSeries: {
              type: 'array',
              nullable: true,
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  points: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        timestamp: { type: 'string', format: 'date-time' },
                        value: { type: 'number' },
                        label: { type: 'string', nullable: true },
                      }
                    }
                  },
                  interval: { 
                    type: 'string', 
                    enum: ['hourly', 'daily', 'weekly', 'monthly'] 
                  }
                }
              }
            },
            generatedAt: { type: 'string', format: 'date-time' },
            validUntil: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          }
        },
        // Pagination schema
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: true
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                totalPages: { type: 'number' },
                totalItems: { type: 'number' },
                hasNextPage: { type: 'boolean' },
                hasPrevPage: { type: 'boolean' }
              }
            }
          }
        },
      },
    },
  },
  // Path to the API docs
  apis: [
    './src/server/routes/*.ts',
    './src/server/controllers/*.ts',
    './src/server/models/*.ts',
  ],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec; 
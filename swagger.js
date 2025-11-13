const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Joint Sense AI API',
      version: '1.0.0',
      description: 'AI-powered knee osteoarthritis prediction and management system API documentation',
      contact: {
        name: 'Joint Sense AI Team',
        email: 'support@jointsenseai.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.jointsenseai.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'User ID' },
            email: { type: 'string', format: 'email', description: 'User email' },
            firstName: { type: 'string', description: 'First name' },
            lastName: { type: 'string', description: 'Last name' },
            phone: { type: 'string', description: 'Phone number' },
            dateOfBirth: { type: 'string', format: 'date', description: 'Date of birth' },
            gender: { type: 'string', enum: ['male', 'female', 'other'], description: 'Gender' },
            role: { type: 'string', enum: ['patient', 'doctor', 'admin'], description: 'User role' },
            profilePicture: { type: 'string', description: 'Profile picture URL' },
            isActive: { type: 'boolean', description: 'Account status' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        XRayImage: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            patientId: { type: 'string', description: 'Reference to User' },
            imageUrl: { type: 'string', description: 'Image URL or base64 data' },
            uploadDate: { type: 'string', format: 'date-time' },
            metadata: {
              type: 'object',
              properties: {
                fileSize: { type: 'number' },
                format: { type: 'string' },
                dimensions: {
                  type: 'object',
                  properties: {
                    width: { type: 'number' },
                    height: { type: 'number' }
                  }
                }
              }
            }
          }
        },
        AIPrediction: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            patientId: { type: 'string' },
            xrayId: { type: 'string' },
            klGrade: { type: 'number', minimum: 0, maximum: 4 },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            severity: { type: 'string', enum: ['normal', 'mild', 'moderate', 'severe'] },
            predictionDate: { type: 'string', format: 'date-time' },
            analysis: {
              type: 'object',
              properties: {
                jointSpaceNarrowing: { type: 'boolean' },
                osteophytes: { type: 'boolean' },
                sclerosis: { type: 'boolean' },
                deformity: { type: 'boolean' }
              }
            }
          }
        },
        ActivityLog: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            date: { type: 'string', format: 'date' },
            activityType: { type: 'string', description: 'walking, swimming, cycling, yoga, etc.' },
            duration: { type: 'number', description: 'Duration in minutes' },
            intensity: { type: 'string', enum: ['low', 'moderate', 'high'] },
            caloriesBurned: { type: 'number' },
            notes: { type: 'string' }
          }
        },
        DietLog: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            date: { type: 'string', format: 'date' },
            mealType: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
            foodItems: { type: 'array', items: { type: 'string' } },
            calories: { type: 'number' },
            nutritionInfo: {
              type: 'object',
              properties: {
                protein: { type: 'number' },
                carbs: { type: 'number' },
                fats: { type: 'number' },
                fiber: { type: 'number' }
              }
            }
          }
        },
        WeightLog: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            date: { type: 'string', format: 'date' },
            weight: { type: 'number', description: 'Weight in kg' },
            bmi: { type: 'number' },
            notes: { type: 'string' }
          }
        },
        Medication: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            patientId: { type: 'string' },
            medicationName: { type: 'string' },
            dosage: { type: 'string' },
            frequency: { type: 'string' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            reminderTime: { type: 'array', items: { type: 'string' } },
            isActive: { type: 'boolean' }
          }
        },
        Consultation: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            patientId: { type: 'string' },
            doctorId: { type: 'string' },
            appointmentDate: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'] },
            consultationType: { type: 'string', enum: ['in-person', 'video', 'phone'] },
            notes: { type: 'string' },
            prescription: { type: 'string' }
          }
        },
        ForumPost: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            authorId: { type: 'string' },
            title: { type: 'string' },
            content: { type: 'string' },
            category: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            likes: { type: 'number' },
            views: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            error: { type: 'string' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFoundError: {
          description: 'The requested resource was not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js', './server.js', './routes/swagger-annotations.js'] // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerUi, swaggerSpec };

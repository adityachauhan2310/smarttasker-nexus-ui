import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from '../config/swagger';

const router = express.Router();

/**
 * @swagger
 * /docs:
 *   get:
 *     summary: API documentation
 *     description: Serves Swagger UI for API documentation
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: Swagger UI
 */
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SmartTasker API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'none',
    filter: true,
  },
}));

/**
 * @swagger
 * /docs/json:
 *   get:
 *     summary: OpenAPI specification
 *     description: Returns the OpenAPI specification in JSON format
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: OpenAPI specification in JSON format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

export default router; 
const request = require('supertest');
const path = require('path');
const fs = require('fs');
const { app, processPDFFile } = require('../src/app');

describe('ISDOC PDF API', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('POST /api/extract-isdoc', () => {
    it('should return 401 when no token provided', async () => {
      const response = await request(app)
        .post('/api/extract-isdoc')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    it('should return 403 when invalid token provided', async () => {
      const response = await request(app)
        .post('/api/extract-isdoc')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Invalid token');
    });

    it('should return 400 when no file provided', async () => {
      const response = await request(app)
        .post('/api/extract-isdoc')
        .set('Authorization', 'Bearer test-token')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'PDF file is required');
    });

    it('should return 400 when non-PDF file uploaded', async () => {
      const response = await request(app)
        .post('/api/extract-isdoc')
        .set('Authorization', 'Bearer test-token')
        .attach('pdf', Buffer.from('not a pdf'), 'test.txt')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Only PDF files are allowed');
    });

    it('should return 400 when file too large', async () => {
      // Create a large buffer (11MB)
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
      
      const response = await request(app)
        .post('/api/extract-isdoc')
        .set('Authorization', 'Bearer test-token')
        .attach('pdf', largeBuffer, 'large.pdf')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'File too large. Maximum size is 10MB.');
    });
  });

  describe('Error handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/unknown-endpoint')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Endpoint not found');
    });
  });
});

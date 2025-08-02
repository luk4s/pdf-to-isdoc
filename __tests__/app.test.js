const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Mock the isdoc-pdf module to avoid actual PDF processing
jest.mock('isdoc-pdf', () => ({
  hasISDOC: jest.fn(),
  extractISDOC: jest.fn()
}));

const { hasISDOC, extractISDOC } = require('isdoc-pdf');
const { app } = require('../src/app');

describe('ISDOC PDF API', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Set up default mock responses
    hasISDOC.mockResolvedValue(true);
    extractISDOC.mockResolvedValue({
      toJSON: () => JSON.stringify({ mockData: 'test' })
    });
  });

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

  describe('POST /api/extract-isdoc - Authentication Tests', () => {
    const mockPDFBuffer = Buffer.from('%PDF-1.4 mock pdf content');

    beforeEach(() => {
      // Mock environment variable for tests
      process.env.AUTH_TOKEN = 'test-token';
    });

    it('should return 401 when no Authorization header provided', async () => {
      const response = await request(app)
        .post('/api/extract-isdoc')
        .attach('pdf', mockPDFBuffer, 'test.pdf')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
      expect(hasISDOC).not.toHaveBeenCalled();
      expect(extractISDOC).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header is malformed', async () => {
      const response = await request(app)
        .post('/api/extract-isdoc')
        .set('Authorization', 'InvalidFormat')
        .attach('pdf', mockPDFBuffer, 'test.pdf')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
      expect(hasISDOC).not.toHaveBeenCalled();
      expect(extractISDOC).not.toHaveBeenCalled();
    });

    it('should return 401 when Bearer token is missing', async () => {
      const response = await request(app)
        .post('/api/extract-isdoc')
        .set('Authorization', 'Bearer ')
        .attach('pdf', mockPDFBuffer, 'test.pdf')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
      expect(hasISDOC).not.toHaveBeenCalled();
      expect(extractISDOC).not.toHaveBeenCalled();
    });

    it('should return 403 when invalid token provided', async () => {
      const response = await request(app)
        .post('/api/extract-isdoc')
        .set('Authorization', 'Bearer wrong-token')
        .attach('pdf', mockPDFBuffer, 'test.pdf')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Invalid token');
      expect(hasISDOC).not.toHaveBeenCalled();
      expect(extractISDOC).not.toHaveBeenCalled();
    });

    it('should return 403 when token does not match AUTH_TOKEN', async () => {
      const response = await request(app)
        .post('/api/extract-isdoc')
        .set('Authorization', 'Bearer another-invalid-token')
        .attach('pdf', mockPDFBuffer, 'test.pdf')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Invalid token');
      expect(hasISDOC).not.toHaveBeenCalled();
      expect(extractISDOC).not.toHaveBeenCalled();
    });

    it('should pass authentication with valid token and proceed to PDF processing', async () => {
      const response = await request(app)
        .post('/api/extract-isdoc')
        .set('Authorization', 'Bearer test-token')
        .attach('pdf', mockPDFBuffer, 'test.pdf')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('extractedAt');
      expect(hasISDOC).toHaveBeenCalledTimes(1);
      expect(extractISDOC).toHaveBeenCalledTimes(1);
    });

    it('should handle PDF processing errors after successful authentication', async () => {
      // Mock PDF processing to return no ISDOC data
      hasISDOC.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/extract-isdoc')
        .set('Authorization', 'Bearer test-token')
        .attach('pdf', mockPDFBuffer, 'test.pdf')
        .expect(422);

      expect(response.body).toHaveProperty('error', 'No ISDOC data found in PDF');
      expect(hasISDOC).toHaveBeenCalledTimes(1);
      expect(extractISDOC).not.toHaveBeenCalled();
    });

    it('should handle ISDOC extraction errors after successful authentication', async () => {
      // Mock hasISDOC to return true but extractISDOC to throw error
      hasISDOC.mockResolvedValue(true);
      extractISDOC.mockRejectedValue(new Error('Extraction failed'));

      const response = await request(app)
        .post('/api/extract-isdoc')
        .set('Authorization', 'Bearer test-token')
        .attach('pdf', mockPDFBuffer, 'test.pdf')
        .expect(422);

      expect(response.body).toHaveProperty('error', 'ISDOC data extraction failed');
      expect(hasISDOC).toHaveBeenCalledTimes(1);
      expect(extractISDOC).toHaveBeenCalledTimes(1);
    });

    it('should require valid token even with valid PDF file', async () => {
      const response = await request(app)
        .post('/api/extract-isdoc')
        .set('Authorization', 'Bearer invalid-token')
        .attach('pdf', mockPDFBuffer, 'test.pdf')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Invalid token');
      expect(hasISDOC).not.toHaveBeenCalled();
      expect(extractISDOC).not.toHaveBeenCalled();
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

const fs = require('fs');
const path = require('path');

describe('Utility Functions', () => {
  describe('File system operations', () => {
    it('should create and clean up temporary files', () => {
      const tempDir = '/tmp';
      const tempFile = path.join(tempDir, `test_${Date.now()}.txt`);
      
      // Create file
      fs.writeFileSync(tempFile, 'test content');
      expect(fs.existsSync(tempFile)).toBe(true);
      
      // Clean up
      fs.unlinkSync(tempFile);
      expect(fs.existsSync(tempFile)).toBe(false);
    });

    it('should handle file size validation', () => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const smallBuffer = Buffer.alloc(1024); // 1KB
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      
      expect(smallBuffer.length).toBeLessThan(maxSize);
      expect(largeBuffer.length).toBeGreaterThan(maxSize);
    });
  });

  describe('Buffer operations', () => {
    it('should create valid PDF-like buffers', () => {
      const pdfHeader = '%PDF-1.4';
      const buffer = Buffer.from(pdfHeader);
      
      expect(buffer.toString()).toBe(pdfHeader);
      expect(buffer.length).toBe(pdfHeader.length);
    });

    it('should handle empty buffers', () => {
      const emptyBuffer = Buffer.alloc(0);
      expect(emptyBuffer.length).toBe(0);
    });
  });

  describe('Environment variables', () => {
    it('should have test environment variables set', () => {
      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.AUTH_TOKEN).toBe('test-token');
      expect(process.env.PORT).toBe('3001');
    });
  });
}); 
const express = require('express');
const multer = require('multer');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { hasISDOC, extractISDOC } = require('isdoc-pdf');

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const AUTH_TOKEN = process.env.AUTH_TOKEN;
if (!AUTH_TOKEN) {
  throw new Error('AUTH_TOKEN is not set')
}

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  if (token !== AUTH_TOKEN) {
    return res.status(403).json({ error: 'Invalid token' });
  }

  next();
};

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Private function to process PDF and extract ISDOC data
async function processPDFFile(tempFilePath) {
  // Read PDF file buffer
  const pdfBuffer = fs.readFileSync(tempFilePath);
  
  // Check if PDF contains ISDOC data
  const hasISDOCData = await hasISDOC(pdfBuffer);
  
  if (!hasISDOCData) {
    return { 
      error: 'No ISDOC data found in PDF',
    };
  }

  // Extract ISDOC data
  let invoice = null;
  try {
    invoice = await extractISDOC(pdfBuffer);
  } catch (extractError) {
    console.error('extractISDOC error:', extractError);
    return { 
      error: 'ISDOC data extraction failed',
    };
  }
  
  if (!invoice) {
    return { 
      error: 'ISDOC data extraction failed',
    };
  }

  try {
    return JSON.parse(invoice.toJSON());
  } catch (jsonError) {
    console.error('JSON parsing error:', jsonError);
    return {
      error: 'Failed to parse ISDOC data',
    };
  }
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// PDF processing endpoint
app.post('/api/extract-isdoc', authenticateToken, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    const pdfBuffer = req.file.buffer;
    
    // Create temporary file for ISDOC processing
    const tempFilePath = path.join('/tmp', `temp_${Date.now()}.pdf`);
    fs.writeFileSync(tempFilePath, pdfBuffer);

    try {
      const result = await processPDFFile(tempFilePath);
      
      if (!result.error) {
        res.json({
          success: true,
          data: result,
          extractedAt: new Date().toISOString()
        });
      } else {
        res.status(422).json({
          error: result.error
        });
      }
    } finally {
      // Clean up temporary file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }

  } catch (error) {
    console.error('Error in PDF processing endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An error occurred while processing the PDF'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  
  if (error.message === 'Only PDF files are allowed') {
    return res.status(400).json({ error: 'Only PDF files are allowed' });
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`ISDOC PDF API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API endpoint: http://localhost:${PORT}/api/extract-isdoc`);
});

module.exports = { app, processPDFFile }; 
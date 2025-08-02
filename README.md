# ISDOC PDF Extractor API

A simple Node.js API application that extracts ISDOC (Invoice Standard Document) data from PDF files using the [isdoc-pdf](https://github.com/deltazero-cz/node-isdoc-pdf) module.

## Features

- 🔐 **Authentication**: Simple token-based authentication
- 📄 **PDF Processing**: Extract ISDOC data from PDF files
- 🐳 **Docker Support**: Ready-to-use Docker configuration
- 🛡️ **Security**: Helmet.js for security headers
- ✅ **Health Checks**: Built-in health monitoring
- 📊 **Error Handling**: Comprehensive error responses
- 📚 **API Documentation**: OpenAPI 3.0 specification
- 🧪 **Testing Examples**: Comprehensive curl examples


## Quick Start

### Using Docker (Recommended)

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd isdoc_pdf_extractor
   ```

2. **Set environment variables:**
   ```bash
   cp env.example .env
   # Edit .env and set your AUTH_TOKEN
   ```

3. **Run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

4. **Test the API:**
   ```bash
   curl http://localhost:3000/health
   ```

### Manual Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set environment variables:**
   ```bash
   cp env.example .env
   # Edit .env and set your AUTH_TOKEN
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

## API Documentation

### OpenAPI Specification

The complete API documentation is available in OpenAPI 3.0 format:

- **OpenAPI Spec**: [`openapi.yml`](./openapi.yml)
- **Interactive Docs**: Import the `openapi.yml` file into Swagger UI or similar tools
- **Client Generation**: Use the OpenAPI spec to generate client libraries

### Authentication

All API endpoints require authentication using a Bearer token in the Authorization header:

```
Authorization: Bearer your-secret-token
```

### Endpoints

#### Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### Extract ISDOC Data
```
POST /api/extract-isdoc
```

**Headers:**
- `Authorization: Bearer your-secret-token`
- `Content-Type: multipart/form-data`

**Body:**
- `pdf`: PDF file (multipart/form-data)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    // ISDOC invoice data as JSON
  },
  "extractedAt": "2024-01-01T12:00:00.000Z"
}
```

**Error Responses:**

- **401 Unauthorized**: Missing or invalid token
- **400 Bad Request**: Invalid file type or missing file
- **422 Unprocessable Entity**: PDF does not contain ISDOC data
- **500 Internal Server Error**: Server error

## Usage Examples

### Using curl

For comprehensive curl examples, see [`curl-examples.md`](./curl-examples.md).

**Quick Examples:**

```bash
# Test health endpoint
curl http://localhost:3000/health

# Extract ISDOC from PDF
curl -X POST \
  -H "Authorization: Bearer your-secret-token" \
  -F "pdf=@invoice.pdf" \
  http://localhost:3000/api/extract-isdoc

# With pretty output
curl -X POST \
  -H "Authorization: Bearer your-secret-token" \
  -F "pdf=@invoice.pdf" \
  http://localhost:3000/api/extract-isdoc | jq '.'
```

### Using JavaScript

```javascript
const FormData = require('form-data');
const fs = require('fs');

const form = new FormData();
form.append('pdf', fs.createReadStream('invoice.pdf'));

fetch('http://localhost:3000/api/extract-isdoc', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-secret-token'
  },
  body: form
})
.then(response => response.json())
.then(data => console.log(data));
```

### Testing Script

Use the included test script for comprehensive API testing:

```bash
# Run basic tests
node test-api.js

# Test with a specific PDF file
node test-api.js path/to/your.pdf
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `AUTH_TOKEN` | `your-secret-token` | Authentication token |
| `NODE_ENV` | `production` | Environment mode |
| `MAX_FILE_SIZE` | `5` | Maximum file size in MB |

### Docker Configuration

The application includes:
- **Dockerfile**: Multi-stage build with security best practices
- **docker-compose.yml**: Easy deployment with environment variables
- **Health checks**: Automatic container health monitoring

## Security Features

- ✅ Helmet.js for security headers
- ✅ CORS protection
- ✅ File size limits (10MB)
- ✅ File type validation (PDF only)
- ✅ Non-root user in Docker
- ✅ Token-based authentication
- ✅ Input validation and sanitization

## Error Handling

The API provides detailed error responses:

- **File validation errors**: Invalid file types, size limits
- **Authentication errors**: Missing or invalid tokens
- **ISDOC processing errors**: PDFs without ISDOC data
- **Server errors**: Internal processing errors

## Development

### Running in Development Mode

```bash
npm run dev
```

### Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### API Testing

```bash
# Test the API endpoints
node test-api.js

# View OpenAPI documentation
# Import openapi.yml into Swagger UI or similar tools

# Use curl examples
# See curl-examples.md for comprehensive examples
```

## License

MIT

## Project Structure

```
isdoc_pdf_extractor/
├── src/
│   └── app.js              # Main Express application
├── __tests__/              # Test files
├── openapi.yml             # OpenAPI 3.0 specification
├── curl-examples.md        # Comprehensive curl examples
├── test-api.js             # API testing script
├── package.json            # Dependencies and scripts
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose setup
└── README.md              # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Update documentation (README, OpenAPI spec, curl examples)
6. Submit a pull request 
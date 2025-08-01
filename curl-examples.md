# ISDOC PDF API - cURL Examples

This document provides comprehensive cURL examples for using the ISDOC PDF API.

## Base Configuration

```bash
# Set your API token
export API_TOKEN="your-secret-token"
export API_BASE_URL="http://localhost:3000"

# Or use these values directly in the examples below
```

## 1. Health Check

### Basic Health Check
```bash
curl -X GET "${API_BASE_URL}/health"
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 2. Extract ISDOC Data

### Successful ISDOC Extraction
```bash
curl -X POST \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -F "pdf=@invoice.pdf" \
  "${API_BASE_URL}/api/extract-isdoc"
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "invoiceId": "INV-2024-001",
    "supplier": {
      "name": "Supplier Name",
      "taxId": "CZ12345678"
    },
    "customer": {
      "name": "Customer Name",
      "taxId": "CZ87654321"
    },
    "totalAmount": 1000.00,
    "currency": "CZK",
    "issueDate": "2024-01-01"
  },
  "extractedAt": "2024-01-01T12:00:00.000Z"
}
```

### With Verbose Output
```bash
curl -X POST \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -F "pdf=@invoice.pdf" \
  -v \
  "${API_BASE_URL}/api/extract-isdoc"
```

### With Progress Bar
```bash
curl -X POST \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -F "pdf=@invoice.pdf" \
  --progress-bar \
  "${API_BASE_URL}/api/extract-isdoc"
```

## 3. Error Scenarios

### Missing Authentication Token
```bash
curl -X POST \
  -F "pdf=@invoice.pdf" \
  "${API_BASE_URL}/api/extract-isdoc"
```

**Response (401):**
```json
{
  "error": "Access token required"
}
```

### Invalid Authentication Token
```bash
curl -X POST \
  -H "Authorization: Bearer invalid-token" \
  -F "pdf=@invoice.pdf" \
  "${API_BASE_URL}/api/extract-isdoc"
```

**Response (403):**
```json
{
  "error": "Invalid token"
}
```

### Missing PDF File
```bash
curl -X POST \
  -H "Authorization: Bearer ${API_TOKEN}" \
  "${API_BASE_URL}/api/extract-isdoc"
```

**Response (400):**
```json
{
  "error": "PDF file is required"
}
```

### Wrong File Type
```bash
curl -X POST \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -F "pdf=@document.txt" \
  "${API_BASE_URL}/api/extract-isdoc"
```

**Response (400):**
```json
{
  "error": "Only PDF files are allowed"
}
```

### File Too Large
```bash
# Create a large file (11MB)
dd if=/dev/zero of=large.pdf bs=1M count=11

curl -X POST \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -F "pdf=@large.pdf" \
  "${API_BASE_URL}/api/extract-isdoc"
```

**Response (400):**
```json
{
  "error": "File too large. Maximum size is 10MB."
}
```

### PDF Without ISDOC Data
```bash
curl -X POST \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -F "pdf=@regular-document.pdf" \
  "${API_BASE_URL}/api/extract-isdoc"
```

**Response (422):**
```json
{
  "error": "No ISDOC data found in PDF",
  "message": "The uploaded PDF does not contain valid ISDOC data"
}
```

## 4. Advanced Examples

### Save Response to File
```bash
curl -X POST \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -F "pdf=@invoice.pdf" \
  -o response.json \
  "${API_BASE_URL}/api/extract-isdoc"
```

### Pretty Print JSON Response
```bash
curl -X POST \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -F "pdf=@invoice.pdf" \
  "${API_BASE_URL}/api/extract-isdoc" | jq '.'
```

### With Custom Headers
```bash
curl -X POST \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: multipart/form-data" \
  -H "Accept: application/json" \
  -F "pdf=@invoice.pdf" \
  "${API_BASE_URL}/api/extract-isdoc"
```

### Test with Different PDF Files
```bash
# Test multiple files
for file in *.pdf; do
  echo "Testing file: $file"
  curl -X POST \
    -H "Authorization: Bearer ${API_TOKEN}" \
    -F "pdf=@$file" \
    "${API_BASE_URL}/api/extract-isdoc" | jq '.success, .error // empty'
  echo ""
done
```

## 5. Script Examples

### Health Check Script
```bash
#!/bin/bash
# health-check.sh

API_BASE_URL="http://localhost:3000"

response=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE_URL}/health")

if [ "$response" = "200" ]; then
    echo "✅ API is healthy"
    curl -s "${API_BASE_URL}/health" | jq '.'
else
    echo "❌ API is not responding (HTTP $response)"
    exit 1
fi
```

### Batch Processing Script
```bash
#!/bin/bash
# batch-process.sh

API_TOKEN="your-secret-token"
API_BASE_URL="http://localhost:3000"
INPUT_DIR="./pdfs"
OUTPUT_DIR="./results"

mkdir -p "$OUTPUT_DIR"

for pdf_file in "$INPUT_DIR"/*.pdf; do
    if [ -f "$pdf_file" ]; then
        filename=$(basename "$pdf_file" .pdf)
        echo "Processing: $filename"
        
        response=$(curl -s -X POST \
            -H "Authorization: Bearer $API_TOKEN" \
            -F "pdf=@$pdf_file" \
            "$API_BASE_URL/api/extract-isdoc")
        
        echo "$response" > "$OUTPUT_DIR/${filename}.json"
        
        if echo "$response" | jq -e '.success' > /dev/null; then
            echo "✅ Success: $filename"
        else
            echo "❌ Failed: $filename"
        fi
    fi
done
```

## 6. Troubleshooting

### Check API Status
```bash
# Check if API is running
curl -I "${API_BASE_URL}/health"

# Check with timeout
curl --connect-timeout 5 --max-time 30 "${API_BASE_URL}/health"
```

### Debug Network Issues
```bash
# Verbose output for debugging
curl -v -X POST \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -F "pdf=@invoice.pdf" \
  "${API_BASE_URL}/api/extract-isdoc"
```

### Test File Upload
```bash
# Test with a minimal PDF
echo "%PDF-1.4" > test.pdf
curl -X POST \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -F "pdf=@test.pdf" \
  "${API_BASE_URL}/api/extract-isdoc"
```

## 7. Environment Setup

### Bash Profile Setup
```bash
# Add to ~/.bashrc or ~/.zshrc
export ISDOC_API_TOKEN="your-secret-token"
export ISDOC_API_URL="http://localhost:3000"

# Function for quick API calls
isdoc_extract() {
    local file="$1"
    curl -X POST \
        -H "Authorization: Bearer $ISDOC_API_TOKEN" \
        -F "pdf=@$file" \
        "$ISDOC_API_URL/api/extract-isdoc" | jq '.'
}
```

### Usage
```bash
# After setting up the function
isdoc_extract invoice.pdf
```

## Notes

- **File Size Limit**: 10MB maximum
- **File Type**: PDF only
- **Authentication**: Bearer token required for all endpoints except `/health`
- **Response Format**: JSON
- **Error Handling**: All errors return JSON with `error` field
- **Timeout**: Consider using `--max-time` for large files 
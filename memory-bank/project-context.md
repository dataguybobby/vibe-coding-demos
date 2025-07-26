# Vibe Coding Demos - Project Context

## Current Demo: AWS S3 Image Management

### Overview
This demo showcases a complete image management system using AWS S3, allowing users to:
- Upload images to S3 bucket
- List all uploaded images
- Download images from S3
- View image metadata

### Technical Stack
- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: Node.js with Express
- **AWS Services**: S3 for storage, IAM for permissions
- **Build Tool**: Vite for fast development
- **Python Tools**: S3 downloader script for batch operations

### Key Features
1. **Image Upload**: Drag & drop or click to upload
2. **Image Gallery**: Grid view of all uploaded images
3. **Download Functionality**: Direct download from S3
4. **Responsive Design**: Works on desktop and mobile
5. **Real-time Updates**: Auto-refresh after uploads
6. **Python S3 Downloader**: Comprehensive script for batch downloads

### Architecture
- Frontend communicates with backend API
- Backend handles S3 operations securely
- Environment variables for AWS credentials
- Proper error handling and loading states
- Python script for advanced S3 operations

### Python S3 Downloader Script
A comprehensive Python script (`s3_downloader.py`) provides advanced S3 functionality:
- **Single file downloads** with progress tracking
- **Batch downloads** of entire directories
- **File filtering** by extension (e.g., only images)
- **Directory preservation** when downloading
- **Detailed logging** and error handling
- **Download reports** with statistics
- **Flexible credentials** (env vars, AWS CLI, or direct)

### Security Features
- **Pre-signed URLs**: Time-limited, secure access to S3 objects
- **AWS SDK v3**: Modern AWS SDK with better error handling
- **Credential validation**: Startup validation of AWS credentials
- **Expiration tracking**: Real-time monitoring of URL expiration
- **Access control**: Temporary URLs that expire automatically

### Security Considerations
- AWS credentials stored in environment variables
- CORS configured for frontend-backend communication
- Input validation and file type restrictions
- Secure S3 bucket policies
- Python script supports multiple credential methods 
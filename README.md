# AWS S3 Image Management Demo

A comprehensive demo showcasing image upload, listing, and download functionality using AWS S3. This project demonstrates a full-stack application with a modern React frontend and Node.js backend.

## 🚀 Features

- **Image Upload**: Drag & drop or click to upload images to S3
- **Image Gallery**: Beautiful grid view of all uploaded images
- **Download Images**: Direct download from S3 bucket
- **Delete Images**: Remove images from S3 with confirmation
- **Real-time Updates**: Auto-refresh after uploads and deletions
- **Responsive Design**: Works perfectly on desktop and mobile
- **Error Handling**: Comprehensive error handling and user feedback
- **Loading States**: Smooth loading animations and progress indicators

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Lucide React** for beautiful icons

### Backend
- **Node.js** with Express
- **AWS SDK** for S3 operations
- **Multer** for file upload handling
- **CORS** for cross-origin requests

### AWS Services
- **S3** for image storage
- **IAM** for secure access management

## 📋 Prerequisites

Before running this demo, you'll need:

1. **Node.js** (v16 or higher)
2. **AWS Account** with S3 access
3. **AWS CLI** (optional, for easier credential management)

## 🔧 Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd vibe-coding-demos
npm run install:all
```

### 2. AWS S3 Setup

1. **Create an S3 Bucket**:
   - Go to AWS S3 Console
   - Create a new bucket (e.g., `my-image-demo-bucket`)
   - Choose your preferred region
   - Keep default settings for now

2. **Configure CORS** (if needed):
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "POST", "DELETE"],
       "AllowedOrigins": ["http://localhost:3000"],
       "ExposeHeaders": []
     }
   ]
   ```

3. **Create IAM User**:
   - Go to AWS IAM Console
   - Create a new user with programmatic access
   - Attach the `AmazonS3FullAccess` policy (or create a custom policy)
   - Save the Access Key ID and Secret Access Key

### 3. Environment Configuration

1. **Backend Configuration**:
   ```bash
   cd backend
   cp env.example .env
   ```

2. **Edit `.env` file**:
   ```env
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=your-s3-bucket-name
   PORT=3001
   NODE_ENV=development
   ```

### 4. Run the Application

```bash
# From the root directory
npm run dev
```

This will start both the frontend (port 3000) and backend (port 3001) simultaneously.

## 🎯 Usage

1. **Upload Images**:
   - Drag and drop images onto the upload area
   - Or click to browse and select files
   - Supported formats: JPG, PNG, GIF, WebP, BMP
   - Maximum file size: 10MB

2. **View Gallery**:
   - All uploaded images appear in a responsive grid
   - Hover over images to see action buttons
   - Click the eye icon to view image details

3. **Download Images**:
   - Click the download icon on any image
   - Images will download directly from S3

4. **Delete Images**:
   - Click the trash icon on any image
   - Confirm deletion in the popup dialog

## 📁 Project Structure

```
vibe-coding-demos/
├── backend/
│   ├── server.js          # Express server with S3 integration
│   ├── package.json       # Backend dependencies
│   └── env.example        # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API service layer
│   │   ├── types/         # TypeScript type definitions
│   │   └── App.tsx        # Main application component
│   ├── package.json       # Frontend dependencies
│   └── vite.config.ts     # Vite configuration
├── memory-bank/           # Project documentation
├── package.json           # Root package.json
└── README.md             # This file
```

## 🔒 Security Considerations

- AWS credentials are stored in environment variables
- CORS is configured for local development
- File type validation prevents malicious uploads
- File size limits prevent abuse
- S3 bucket policies should be configured for production

## 🚀 Deployment

### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy the dist/ folder to your hosting service
```

### Backend Deployment
```bash
cd backend
npm start
# Deploy to your preferred hosting service (Heroku, AWS, etc.)
```

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Ensure the backend is running on port 3001
   - Check that CORS is properly configured

2. **AWS Credentials**:
   - Verify your AWS credentials in the `.env` file
   - Ensure the IAM user has S3 permissions

3. **S3 Bucket Access**:
   - Check that the bucket name is correct
   - Verify the bucket exists in the specified region

4. **File Upload Issues**:
   - Check file size (max 10MB)
   - Ensure file type is supported
   - Verify network connectivity

## 📝 API Endpoints

- `GET /api/health` - Health check
- `POST /api/upload` - Upload image to S3
- `GET /api/images` - List all images
- `GET /api/images/:key` - Get image details
- `DELETE /api/images/:key` - Delete image

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- AWS S3 for reliable cloud storage
- React team for the amazing frontend framework
- Tailwind CSS for the utility-first styling
- Vite for the fast build tool 
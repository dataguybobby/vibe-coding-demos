# S3 Image Demo - Setup Checklist

## ✅ Prerequisites Check
- [ ] Node.js v16+ installed
- [ ] AWS account with S3 access
- [ ] Git installed

## 🔧 Installation Steps
- [ ] Clone repository
- [ ] Run `npm run install:all` from root
- [ ] Verify all dependencies installed

## ☁️ AWS Setup
- [ ] Create S3 bucket for images
- [ ] Note bucket name and region
- [ ] Create IAM user with S3 permissions
- [ ] Save Access Key ID and Secret Access Key
- [ ] Configure CORS on S3 bucket (if needed)

## ⚙️ Environment Configuration
- [ ] Copy `backend/env.example` to `backend/.env`
- [ ] Fill in AWS credentials in `.env`
- [ ] Set correct S3 bucket name
- [ ] Verify AWS region matches bucket region

## 🚀 Running the Demo
- [ ] Start both frontend and backend: `npm run dev`
- [ ] Frontend should be available at http://localhost:3000
- [ ] Backend should be available at http://localhost:3001
- [ ] Test health endpoint: http://localhost:3001/api/health

## 🧪 Testing Features
- [ ] Upload an image via drag & drop
- [ ] Upload an image via file browser
- [ ] View uploaded images in gallery
- [ ] Download an image
- [ ] Delete an image
- [ ] Test responsive design on mobile

## 🔍 Troubleshooting
- [ ] Check browser console for errors
- [ ] Verify backend logs for API errors
- [ ] Confirm AWS credentials are correct
- [ ] Ensure S3 bucket exists and is accessible
- [ ] Check CORS configuration if needed

## 📝 Notes
- Maximum file size: 10MB
- Supported formats: JPG, PNG, GIF, WebP, BMP
- Images are stored with UUID names for security
- Original filenames are preserved in metadata 
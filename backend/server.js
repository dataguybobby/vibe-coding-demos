import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { S3Client, PutObjectCommand, ListObjectsV2Command, HeadObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Validate required environment variables
const requiredEnvVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_BUCKET_NAME'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

// Configure AWS SDK v3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// Helper function to handle S3 errors
const handleS3Error = (error, operation) => {
  console.error(`S3 ${operation} error:`, error);
  
  if (error.name === 'NoSuchBucket') {
    return {
      status: 404,
      error: 'S3 bucket not found',
      details: `Bucket '${BUCKET_NAME}' does not exist or is not accessible`
    };
  }
  
  if (error.name === 'NoSuchKey') {
    return {
      status: 404,
      error: 'File not found',
      details: 'The requested file does not exist in the S3 bucket'
    };
  }
  
  if (error.name === 'AccessDenied') {
    return {
      status: 403,
      error: 'Access denied',
      details: 'Insufficient permissions to access the S3 bucket'
    };
  }
  
  if (error.name === 'InvalidAccessKeyId' || error.name === 'SignatureDoesNotMatch') {
    return {
      status: 401,
      error: 'Invalid credentials',
      details: 'AWS credentials are invalid or expired'
    };
  }
  
  if (error.name === 'NetworkingError' || error.name === 'TimeoutError') {
    return {
      status: 503,
      error: 'S3 service unavailable',
      details: 'Unable to connect to AWS S3 service'
    };
  }
  
  return {
    status: 500,
    error: `S3 ${operation} failed`,
    details: error.message
  };
};

// Helper function to generate pre-signed URLs
const generatePresignedUrl = async (key, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    throw error;
  }
};

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'S3 Image Demo API is running' });
});

// Upload image to S3
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileExtension = path.extname(req.file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      Metadata: {
        originalName: req.file.originalname,
        uploadedAt: new Date().toISOString()
      }
    });

    await s3Client.send(uploadCommand);
    
    // Construct the S3 URL
    const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileName}`;
    
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        fileName: fileName,
        originalName: req.file.originalname,
        url: s3Url,
        size: req.file.size,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    const errorResponse = handleS3Error(error, 'upload');
    res.status(errorResponse.status).json(errorResponse);
  }
});

// List all images in S3 bucket
app.get('/api/images', async (req, res) => {
  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      MaxKeys: 100 // Limit to 100 images
    });

    const result = await s3Client.send(listCommand);
    
    if (!result.Contents) {
      return res.json({
        success: true,
        data: [],
        count: 0
      });
    }
    
    // Get expiration time from query parameter (default 1 hour)
    const expiresIn = parseInt(req.query.expiresIn) || 3600;
    
    // Generate pre-signed URLs for each image
    const imagesWithUrls = await Promise.all(
      result.Contents
        .filter(item => {
          // Only include image files
          const extension = path.extname(item.Key).toLowerCase();
          return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(extension);
        })
        .map(async (item) => {
          try {
            const presignedUrl = await generatePresignedUrl(item.Key, expiresIn);
            return {
              key: item.Key,
              size: item.Size,
              lastModified: item.LastModified,
              url: presignedUrl,
              expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
            };
          } catch (error) {
            console.error(`Failed to generate pre-signed URL for ${item.Key}:`, error);
            // Return item without URL if pre-signed URL generation fails
            return {
              key: item.Key,
              size: item.Size,
              lastModified: item.LastModified,
              url: null,
              error: 'Failed to generate access URL'
            };
          }
        })
    );
    
    // Filter out items with errors and sort by last modified
    const validImages = imagesWithUrls
      .filter(item => item.url !== null)
      .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

    res.json({
      success: true,
      data: validImages,
      count: validImages.length,
      expiresIn: expiresIn
    });
  } catch (error) {
    const errorResponse = handleS3Error(error, 'list');
    res.status(errorResponse.status).json(errorResponse);
  }
});

// Get image details
app.get('/api/images/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    const headCommand = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    const result = await s3Client.send(headCommand);
    
    // Get expiration time from query parameter (default 1 hour)
    const expiresIn = parseInt(req.query.expiresIn) || 3600;
    
    // Generate pre-signed URL for the image
    const presignedUrl = await generatePresignedUrl(key, expiresIn);
    
    res.json({
      success: true,
      data: {
        key: key,
        size: result.ContentLength,
        contentType: result.ContentType,
        lastModified: result.LastModified,
        metadata: result.Metadata || {},
        url: presignedUrl,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
      }
    });
  } catch (error) {
    const errorResponse = handleS3Error(error, 'get');
    res.status(errorResponse.status).json(errorResponse);
  }
});

// Generate pre-signed URL for a specific image
app.get('/api/images/:key/url', async (req, res) => {
  try {
    const { key } = req.params;
    
    // Get expiration time from query parameter (default 1 hour)
    const expiresIn = parseInt(req.query.expiresIn) || 3600;
    
    // Validate expiration time (max 24 hours for security)
    if (expiresIn > 86400) {
      return res.status(400).json({
        error: 'Invalid expiration time',
        details: 'Expiration time cannot exceed 24 hours (86400 seconds)'
      });
    }
    
    // Check if the object exists first
    const headCommand = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });
    
    await s3Client.send(headCommand);
    
    // Generate pre-signed URL
    const presignedUrl = await generatePresignedUrl(key, expiresIn);
    
    res.json({
      success: true,
      data: {
        key: key,
        url: presignedUrl,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
        expiresIn: expiresIn
      }
    });
  } catch (error) {
    const errorResponse = handleS3Error(error, 'generate_url');
    res.status(errorResponse.status).json(errorResponse);
  }
});

// Delete image from S3
app.delete('/api/images/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    await s3Client.send(deleteCommand);
    
    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    const errorResponse = handleS3Error(error, 'delete');
    res.status(errorResponse.status).json(errorResponse);
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: error.message 
  });
});

// Test S3 connection on startup
const testS3Connection = async () => {
  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      MaxKeys: 1
    });
    await s3Client.send(listCommand);
    console.log('✅ S3 connection successful');
  } catch (error) {
    console.error('❌ S3 connection failed:', error.message);
    console.error('Please check your AWS credentials and bucket configuration.');
    process.exit(1);
  }
};

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 S3 Image Demo API running on port ${PORT}`);
  console.log(`📁 S3 Bucket: ${BUCKET_NAME}`);
  console.log(`🌍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 AWS Region: ${process.env.AWS_REGION || 'us-east-1'}`);
  
  // Test S3 connection
  await testS3Connection();
}); 
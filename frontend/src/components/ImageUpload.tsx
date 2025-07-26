import React, { useState, useCallback } from 'react';
import { Upload, Cloud, AlertCircle, CheckCircle } from 'lucide-react';
import { apiService } from '../services/api';

interface ImageUploadProps {
  onUploadSuccess: () => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onUploadSuccess }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileUpload(imageFile);
    } else {
      setErrorMessage('Please drop an image file');
      setUploadStatus('error');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadStatus('idle');
    setErrorMessage('');

    try {
      await apiService.uploadImage(file);
      setUploadStatus('success');
      onUploadSuccess();
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setUploadStatus('idle');
      }, 3000);
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="card">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Images</h2>
        <p className="text-gray-600">Drag and drop your images here or click to browse</p>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          isDragOver
            ? 'border-primary-400 bg-primary-50'
            : 'border-gray-300 hover:border-primary-300'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        
        <div className="space-y-4">
          {uploadStatus === 'success' ? (
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          ) : uploadStatus === 'error' ? (
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          ) : (
            <Cloud className="mx-auto h-12 w-12 text-gray-400" />
          )}
          
          <div>
            {uploadStatus === 'success' ? (
              <p className="text-green-600 font-medium">Upload successful!</p>
            ) : uploadStatus === 'error' ? (
              <p className="text-red-600 font-medium">{errorMessage}</p>
            ) : (
              <>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {isUploading ? 'Uploading...' : 'Drop your image here'}
                </p>
                <p className="text-sm text-gray-500">
                  Supports: JPG, PNG, GIF, WebP, BMP (max 10MB)
                </p>
              </>
            )}
          </div>
          
          {uploadStatus === 'idle' && !isUploading && (
            <button className="btn-primary inline-flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Choose File
            </button>
          )}
        </div>
      </div>

      {isUploading && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 text-primary-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
            Uploading image...
          </div>
        </div>
      )}
    </div>
  );
}; 
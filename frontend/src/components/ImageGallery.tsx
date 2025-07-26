import React, { useState, useEffect } from 'react';
import { Download, Trash2, Eye, Calendar, HardDrive, Clock, AlertTriangle } from 'lucide-react';
import { ImageData } from '../types';
import { apiService } from '../services/api';

interface ImageGalleryProps {
  images: ImageData[];
  onRefresh: () => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, onRefresh }) => {
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [expiredImages, setExpiredImages] = useState<Set<string>>(new Set());

  // Check for expired URLs
  useEffect(() => {
    const checkExpiredUrls = () => {
      const expired = new Set<string>();
      images.forEach(image => {
        if (image.expiresAt && new Date(image.expiresAt) < new Date()) {
          expired.add(image.key);
        }
      });
      setExpiredImages(expired);
    };

    checkExpiredUrls();
    const interval = setInterval(checkExpiredUrls, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [images]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date | string): string => {
    // Convert string to Date if needed
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Unknown date';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  };

  const formatTimeRemaining = (expiresAt: string): string => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) {
      return 'Expired';
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleDownload = async (image: ImageData) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.key;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  const handleDelete = async (image: ImageData) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    setIsDeleting(image.key);
    try {
      await apiService.deleteImage(image.key);
      onRefresh();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Delete failed. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  if (images.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="text-gray-400 mb-4">
          <HardDrive className="mx-auto h-16 w-16" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No images yet</h3>
        <p className="text-gray-600">Upload your first image to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Image Gallery</h2>
        <span className="text-sm text-gray-500">{images.length} image{images.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {images.map((image) => (
          <div
            key={image.key}
            className="card p-4 hover:shadow-md transition-shadow duration-200"
          >
            <div className="relative group">
              {expiredImages.has(image.key) && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg z-10">
                  <div className="text-center text-white">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">URL Expired</p>
                  </div>
                </div>
              )}
              <img
                src={image.url}
                alt={image.key}
                className={`w-full h-48 object-cover rounded-lg mb-3 ${expiredImages.has(image.key) ? 'opacity-50' : ''}`}
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCAxMDBDODAgODkuNTQ0NyA4OC4wMDAxIDgxIDk4IDgxQzEwNy45OTkgODEgMTE2IDg5LjU0NDcgMTE2IDEwMEMxMTYgMTEwLjQ1NSAxMDcuOTk5IDExOSA5OCAxMTlDODguMDAwMSAxMTkgODAgMTEwLjQ1NSA4MCAxMDBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0xMzAgMTMwTDEwMCAxMDBMMTcwIDEwMEwxMzAgMTMwWiIgZmlsbD0iIzlCOUJBQCIvPgo8L3N2Zz4K';
                }}
              />
              
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedImage(image)}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title="View details"
                  >
                    <Eye className="h-4 w-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => handleDownload(image)}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title="Download"
                  >
                    <Download className="h-4 w-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => handleDelete(image)}
                    disabled={isDeleting === image.key}
                    className="p-2 bg-white rounded-full hover:bg-red-100 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 truncate" title={image.key}>
                {image.key}
              </h3>
              
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                {formatDate(image.lastModified)}
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <HardDrive className="h-4 w-4 mr-1" />
                {formatFileSize(image.size)}
              </div>
              
              {image.expiresAt && (
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className={expiredImages.has(image.key) ? 'text-red-500' : 'text-gray-500'}>
                    {formatTimeRemaining(image.expiresAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Image Details Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Image Details</h3>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <img
                src={selectedImage.url}
                alt={selectedImage.key}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">File name:</span>
                  <span className="font-medium">{selectedImage.key}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium">{formatFileSize(selectedImage.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Uploaded:</span>
                  <span className="font-medium">{formatDate(selectedImage.lastModified)}</span>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => handleDownload(selectedImage)}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button
                  onClick={() => {
                    handleDelete(selectedImage);
                    setSelectedImage(null);
                  }}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 
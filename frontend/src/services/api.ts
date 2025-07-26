import { UploadResponse, ImagesResponse, ImageDetails, ApiError, PresignedUrlResponse } from '../types';

const API_BASE_URL = '/api';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async uploadImage(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.error || `Upload failed! status: ${response.status}`);
    }

    return await response.json();
  }

  async getImages(): Promise<ImagesResponse> {
    const response = await this.request<ImagesResponse>('/images');
    
    // Convert lastModified strings to Date objects
    if (response.data) {
      response.data = response.data.map(image => ({
        ...image,
        lastModified: typeof image.lastModified === 'string' 
          ? new Date(image.lastModified) 
          : image.lastModified
      }));
    }
    
    return response;
  }

  async getImageDetails(key: string): Promise<ImageDetails> {
    const response = await this.request<ImageDetails>(`/images/${encodeURIComponent(key)}`);
    
    // Convert lastModified string to Date object
    if (response.lastModified && typeof response.lastModified === 'string') {
      response.lastModified = new Date(response.lastModified);
    }
    
    return response;
  }

  async getPresignedUrl(key: string, expiresIn?: number): Promise<PresignedUrlResponse> {
    const params = expiresIn ? `?expiresIn=${expiresIn}` : '';
    return this.request<PresignedUrlResponse>(`/images/${encodeURIComponent(key)}/url${params}`);
  }

  async deleteImage(key: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/images/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });
  }

  async checkHealth(): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>('/health');
  }
}

export const apiService = new ApiService(); 
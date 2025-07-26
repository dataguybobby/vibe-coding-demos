export interface ImageData {
  key: string;
  size: number;
  lastModified: Date | string;
  url: string;
  expiresAt?: string;
  error?: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    fileName: string;
    originalName: string;
    url: string;
    size: number;
    uploadedAt: string;
  };
}

export interface ImagesResponse {
  success: boolean;
  data: ImageData[];
  count: number;
}

export interface ImageDetails {
  key: string;
  size: number;
  contentType: string;
  lastModified: Date | string;
  metadata: Record<string, string>;
  url: string;
  expiresAt?: string;
}

export interface ApiError {
  error: string;
  details?: string;
}

export interface PresignedUrlResponse {
  success: boolean;
  data: {
    key: string;
    url: string;
    expiresAt: string;
    expiresIn: number;
  };
} 
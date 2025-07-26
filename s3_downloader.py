#!/usr/bin/env python3
"""
S3 File Downloader Script

A comprehensive Python script to access and download files from AWS S3 buckets.
Supports single file downloads, batch downloads, and directory synchronization.

Features:
- Download single files or entire directories
- Progress tracking with tqdm
- Configurable download location
- File filtering by extension
- Resume interrupted downloads
- Detailed logging and error handling
"""

import os
import sys
import argparse
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
import boto3
from botocore.exceptions import ClientError, NoCredentialsError, PartialCredentialsError
from tqdm import tqdm
import json
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('s3_downloader.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class S3Downloader:
    """Main class for handling S3 file downloads."""
    
    def __init__(self, 
                 aws_access_key_id: Optional[str] = None,
                 aws_secret_access_key: Optional[str] = None,
                 region_name: Optional[str] = None,
                 bucket_name: str = None):
        """
        Initialize S3 client and downloader.
        
        Args:
            aws_access_key_id: AWS access key ID
            aws_secret_access_key: AWS secret access key
            region_name: AWS region name
            bucket_name: S3 bucket name
        """
        self.bucket_name = bucket_name
        self.download_path = Path.cwd() / "downloads"
        self.download_path.mkdir(exist_ok=True)
        
        # Initialize S3 client
        try:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=aws_access_key_id,
                aws_secret_access_key=aws_secret_access_key,
                region_name=region_name
            )
            logger.info("S3 client initialized successfully")
        except (NoCredentialsError, PartialCredentialsError) as e:
            logger.error(f"AWS credentials error: {e}")
            logger.info("Please set AWS credentials via environment variables or AWS CLI")
            sys.exit(1)
        except Exception as e:
            logger.error(f"Failed to initialize S3 client: {e}")
            sys.exit(1)
    
    def list_buckets(self) -> List[str]:
        """List all accessible S3 buckets."""
        try:
            response = self.s3_client.list_buckets()
            buckets = [bucket['Name'] for bucket in response['Buckets']]
            logger.info(f"Found {len(buckets)} buckets")
            return buckets
        except ClientError as e:
            logger.error(f"Failed to list buckets: {e}")
            return []
    
    def list_objects(self, 
                    bucket_name: Optional[str] = None,
                    prefix: str = "",
                    max_keys: int = 1000) -> List[Dict[str, Any]]:
        """
        List objects in a bucket with optional prefix filtering.
        
        Args:
            bucket_name: S3 bucket name (uses instance bucket if None)
            prefix: Object key prefix to filter by
            max_keys: Maximum number of keys to return
            
        Returns:
            List of object dictionaries with key, size, and last_modified
        """
        bucket = bucket_name or self.bucket_name
        if not bucket:
            logger.error("No bucket name specified")
            return []
        
        try:
            paginator = self.s3_client.get_paginator('list_objects_v2')
            page_iterator = paginator.paginate(
                Bucket=bucket,
                Prefix=prefix,
                PaginationConfig={'MaxItems': max_keys}
            )
            
            objects = []
            for page in page_iterator:
                if 'Contents' in page:
                    for obj in page['Contents']:
                        objects.append({
                            'key': obj['Key'],
                            'size': obj['Size'],
                            'last_modified': obj['LastModified'],
                            'etag': obj['ETag']
                        })
            
            logger.info(f"Found {len(objects)} objects in bucket '{bucket}'")
            return objects
            
        except ClientError as e:
            logger.error(f"Failed to list objects in bucket '{bucket}': {e}")
            return []
    
    def download_file(self, 
                     object_key: str,
                     local_path: Optional[str] = None,
                     bucket_name: Optional[str] = None) -> bool:
        """
        Download a single file from S3.
        
        Args:
            object_key: S3 object key
            local_path: Local file path (auto-generated if None)
            bucket_name: S3 bucket name (uses instance bucket if None)
            
        Returns:
            True if download successful, False otherwise
        """
        bucket = bucket_name or self.bucket_name
        if not bucket:
            logger.error("No bucket name specified")
            return False
        
        # Determine local file path
        if local_path:
            local_file = Path(local_path)
        else:
            local_file = self.download_path / Path(object_key).name
        
        # Create directory if it doesn't exist
        local_file.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            # Get object metadata for progress tracking
            response = self.s3_client.head_object(Bucket=bucket, Key=object_key)
            file_size = response['ContentLength']
            
            logger.info(f"Downloading {object_key} ({file_size} bytes) to {local_file}")
            
            # Download with progress bar
            with tqdm(total=file_size, unit='B', unit_scale=True, desc=object_key) as pbar:
                self.s3_client.download_file(
                    bucket,
                    object_key,
                    str(local_file),
                    Callback=lambda bytes_transferred: pbar.update(bytes_transferred)
                )
            
            logger.info(f"Successfully downloaded {object_key}")
            return True
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchKey':
                logger.error(f"Object '{object_key}' not found in bucket '{bucket}'")
            elif error_code == 'NoSuchBucket':
                logger.error(f"Bucket '{bucket}' not found")
            else:
                logger.error(f"Failed to download {object_key}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error downloading {object_key}: {e}")
            return False
    
    def download_directory(self,
                          prefix: str = "",
                          extensions: Optional[List[str]] = None,
                          bucket_name: Optional[str] = None,
                          max_files: Optional[int] = None) -> Dict[str, Any]:
        """
        Download all files in a directory (prefix) from S3.
        
        Args:
            prefix: S3 object key prefix (directory)
            extensions: List of file extensions to filter by
            bucket_name: S3 bucket name (uses instance bucket if None)
            max_files: Maximum number of files to download
            
        Returns:
            Dictionary with download statistics
        """
        bucket = bucket_name or self.bucket_name
        if not bucket:
            logger.error("No bucket name specified")
            return {'success': False, 'downloaded': 0, 'failed': 0, 'errors': []}
        
        # List objects in the directory
        objects = self.list_objects(bucket, prefix)
        if not objects:
            logger.warning(f"No objects found with prefix '{prefix}' in bucket '{bucket}'")
            return {'success': True, 'downloaded': 0, 'failed': 0, 'errors': []}
        
        # Filter by extensions if specified
        if extensions:
            objects = [
                obj for obj in objects 
                if any(obj['key'].lower().endswith(ext.lower()) for ext in extensions)
            ]
            logger.info(f"Filtered to {len(objects)} objects with extensions: {extensions}")
        
        # Limit number of files if specified
        if max_files and len(objects) > max_files:
            objects = objects[:max_files]
            logger.info(f"Limited to {max_files} files")
        
        # Download files
        downloaded = 0
        failed = 0
        errors = []
        
        logger.info(f"Starting download of {len(objects)} files from '{prefix}'")
        
        for obj in objects:
            object_key = obj['key']
            
            # Skip if it's a directory marker
            if object_key.endswith('/'):
                continue
            
            # Create local path preserving directory structure
            relative_path = object_key[len(prefix):].lstrip('/')
            local_file = self.download_path / relative_path
            
            if self.download_file(object_key, str(local_file), bucket):
                downloaded += 1
            else:
                failed += 1
                errors.append(object_key)
        
        stats = {
            'success': failed == 0,
            'downloaded': downloaded,
            'failed': failed,
            'errors': errors,
            'total_files': len(objects)
        }
        
        logger.info(f"Download complete: {downloaded} successful, {failed} failed")
        return stats
    
    def get_file_info(self, 
                     object_key: str,
                     bucket_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Get detailed information about an S3 object.
        
        Args:
            object_key: S3 object key
            bucket_name: S3 bucket name (uses instance bucket if None)
            
        Returns:
            Dictionary with object metadata or None if error
        """
        bucket = bucket_name or self.bucket_name
        if not bucket:
            logger.error("No bucket name specified")
            return None
        
        try:
            response = self.s3_client.head_object(Bucket=bucket, Key=object_key)
            
            info = {
                'key': object_key,
                'size': response['ContentLength'],
                'last_modified': response['LastModified'],
                'etag': response['ETag'],
                'content_type': response.get('ContentType', 'unknown'),
                'metadata': response.get('Metadata', {})
            }
            
            return info
            
        except ClientError as e:
            logger.error(f"Failed to get info for {object_key}: {e}")
            return None
    
    def generate_download_report(self, stats: Dict[str, Any]) -> str:
        """Generate a formatted download report."""
        report = f"""
=== S3 Download Report ===
Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Bucket: {self.bucket_name}
Download Path: {self.download_path}

Statistics:
- Total files processed: {stats.get('total_files', 0)}
- Successfully downloaded: {stats.get('downloaded', 0)}
- Failed downloads: {stats.get('failed', 0)}
- Success rate: {(stats.get('downloaded', 0) / max(stats.get('total_files', 1), 1) * 100):.1f}%

"""
        
        if stats.get('errors'):
            report += "Failed files:\n"
            for error in stats['errors']:
                report += f"  - {error}\n"
        
        return report


def main():
    """Main function to handle command line interface."""
    parser = argparse.ArgumentParser(
        description="Download files from AWS S3 bucket",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # List all buckets
  python s3_downloader.py --list-buckets
  
  # List objects in a bucket
  python s3_downloader.py --bucket my-bucket --list-objects
  
  # Download a single file
  python s3_downloader.py --bucket my-bucket --download-file path/to/file.jpg
  
  # Download all files in a directory
  python s3_downloader.py --bucket my-bucket --download-dir images/
  
  # Download only image files
  python s3_downloader.py --bucket my-bucket --download-dir images/ --extensions .jpg .png .gif
  
  # Download with custom credentials
  python s3_downloader.py --bucket my-bucket --download-dir images/ --access-key AKIA... --secret-key ...
        """
    )
    
    # AWS credentials
    parser.add_argument('--access-key', help='AWS Access Key ID')
    parser.add_argument('--secret-key', help='AWS Secret Access Key')
    parser.add_argument('--region', default='us-east-1', help='AWS region (default: us-east-1)')
    
    # Bucket and object selection
    parser.add_argument('--bucket', help='S3 bucket name')
    parser.add_argument('--list-buckets', action='store_true', help='List all accessible buckets')
    parser.add_argument('--list-objects', action='store_true', help='List objects in bucket')
    parser.add_argument('--prefix', default='', help='Object key prefix for filtering')
    
    # Download options
    parser.add_argument('--download-file', help='Download a specific file')
    parser.add_argument('--download-dir', help='Download all files in a directory')
    parser.add_argument('--local-path', help='Local path for downloaded file')
    parser.add_argument('--extensions', nargs='+', help='File extensions to filter by')
    parser.add_argument('--max-files', type=int, help='Maximum number of files to download')
    
    # Output options
    parser.add_argument('--output-dir', help='Download directory (default: ./downloads)')
    parser.add_argument('--quiet', action='store_true', help='Suppress progress bars')
    
    args = parser.parse_args()
    
    # Initialize downloader
    downloader = S3Downloader(
        aws_access_key_id=args.access_key,
        aws_secret_access_key=args.secret_key,
        region_name=args.region,
        bucket_name=args.bucket
    )
    
    if args.output_dir:
        downloader.download_path = Path(args.output_dir)
        downloader.download_path.mkdir(parents=True, exist_ok=True)
    
    # Suppress progress bars if quiet mode
    if args.quiet:
        tqdm.disabled = True
    
    try:
        # List buckets
        if args.list_buckets:
            buckets = downloader.list_buckets()
            print("\nAvailable buckets:")
            for bucket in buckets:
                print(f"  - {bucket}")
            return
        
        # List objects
        if args.list_objects:
            if not args.bucket:
                logger.error("Bucket name required for listing objects")
                return
            
            objects = downloader.list_objects(args.bucket, args.prefix)
            print(f"\nObjects in bucket '{args.bucket}':")
            for obj in objects:
                size_mb = obj['size'] / (1024 * 1024)
                modified = obj['last_modified'].strftime('%Y-%m-%d %H:%M:%S')
                print(f"  - {obj['key']} ({size_mb:.2f} MB, {modified})")
            return
        
        # Download single file
        if args.download_file:
            if not args.bucket:
                logger.error("Bucket name required for downloading")
                return
            
            success = downloader.download_file(
                args.download_file,
                args.local_path,
                args.bucket
            )
            if success:
                print(f"✅ Successfully downloaded {args.download_file}")
            else:
                print(f"❌ Failed to download {args.download_file}")
            return
        
        # Download directory
        if args.download_dir:
            if not args.bucket:
                logger.error("Bucket name required for downloading")
                return
            
            stats = downloader.download_directory(
                args.download_dir,
                args.extensions,
                args.bucket,
                args.max_files
            )
            
            # Print report
            report = downloader.generate_download_report(stats)
            print(report)
            
            # Save report to file
            report_file = downloader.download_path / "download_report.txt"
            with open(report_file, 'w') as f:
                f.write(report)
            print(f"Download report saved to: {report_file}")
            return
        
        # If no action specified, show help
        if not any([args.list_buckets, args.list_objects, args.download_file, args.download_dir]):
            parser.print_help()
    
    except KeyboardInterrupt:
        logger.info("Download interrupted by user")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main() 
#!/usr/bin/env python3
"""
Example usage of the S3Downloader class

This script demonstrates how to use the S3Downloader class programmatically
for common S3 operations like listing buckets, downloading files, etc.
"""

from s3_downloader import S3Downloader
import os

def main():
    """Example usage of S3Downloader class."""
    
    # Example 1: Basic initialization with environment variables
    print("=== Example 1: Basic S3Downloader initialization ===")
    
    # Initialize downloader (uses environment variables for credentials)
    downloader = S3Downloader(
        region_name='us-east-1',  # Change to your region
        bucket_name='your-s3-bucket-name'  # Change to your bucket
    )
    
    # Example 2: List all accessible buckets
    print("\n=== Example 2: List all buckets ===")
    buckets = downloader.list_buckets()
    for bucket in buckets:
        print(f"  - {bucket}")
    
    # Example 3: List objects in a bucket
    print("\n=== Example 3: List objects in bucket ===")
    objects = downloader.list_objects(prefix='images/')  # List objects in images/ directory
    for obj in objects[:5]:  # Show first 5 objects
        size_mb = obj['size'] / (1024 * 1024)
        print(f"  - {obj['key']} ({size_mb:.2f} MB)")
    
    # Example 4: Download a single file
    print("\n=== Example 4: Download single file ===")
    if objects:
        first_file = objects[0]['key']
        success = downloader.download_file(first_file)
        if success:
            print(f"✅ Successfully downloaded {first_file}")
        else:
            print(f"❌ Failed to download {first_file}")
    
    # Example 5: Download all image files
    print("\n=== Example 5: Download all image files ===")
    stats = downloader.download_directory(
        prefix='images/',
        extensions=['.jpg', '.png', '.gif', '.webp'],
        max_files=10  # Limit to 10 files for demo
    )
    
    print(f"Download complete:")
    print(f"  - Downloaded: {stats['downloaded']}")
    print(f"  - Failed: {stats['failed']}")
    print(f"  - Success rate: {(stats['downloaded'] / max(stats['total_files'], 1) * 100):.1f}%")
    
    # Example 6: Get file information
    print("\n=== Example 6: Get file information ===")
    if objects:
        file_info = downloader.get_file_info(objects[0]['key'])
        if file_info:
            print(f"File: {file_info['key']}")
            print(f"Size: {file_info['size']} bytes")
            print(f"Type: {file_info['content_type']}")
            print(f"Modified: {file_info['last_modified']}")
    
    # Example 7: Generate download report
    print("\n=== Example 7: Generate download report ===")
    report = downloader.generate_download_report(stats)
    print(report)
    
    # Example 8: Custom download path
    print("\n=== Example 8: Custom download path ===")
    custom_downloader = S3Downloader(
        region_name='us-east-1',
        bucket_name='your-s3-bucket-name'
    )
    custom_downloader.download_path = os.path.join(os.getcwd(), 'custom_downloads')
    
    # Download a file to custom location
    if objects:
        success = custom_downloader.download_file(
            objects[0]['key'],
            os.path.join(custom_downloader.download_path, 'custom_name.jpg')
        )
        if success:
            print(f"✅ Downloaded to custom location: {custom_downloader.download_path}")
    
    print("\n=== Examples completed ===")
    print("Check the 'downloads' directory for downloaded files")
    print("Check 's3_downloader.log' for detailed logs")

def example_with_credentials():
    """Example using explicit credentials (not recommended for production)."""
    print("\n=== Example with explicit credentials ===")
    
    # WARNING: Don't hardcode credentials in production code!
    # Use environment variables or AWS CLI instead
    downloader = S3Downloader(
        aws_access_key_id='YOUR_ACCESS_KEY',  # Replace with your key
        aws_secret_access_key='YOUR_SECRET_KEY',  # Replace with your secret
        region_name='us-east-1',
        bucket_name='your-bucket-name'
    )
    
    # List buckets
    buckets = downloader.list_buckets()
    print(f"Found {len(buckets)} buckets")

def example_error_handling():
    """Example of error handling."""
    print("\n=== Example error handling ===")
    
    try:
        # Try to access non-existent bucket
        downloader = S3Downloader(bucket_name='non-existent-bucket')
        objects = downloader.list_objects()
        print(f"Found {len(objects)} objects")
    except Exception as e:
        print(f"Expected error: {e}")
    
    try:
        # Try to download non-existent file
        downloader = S3Downloader(bucket_name='your-bucket-name')
        success = downloader.download_file('non-existent-file.jpg')
        if not success:
            print("Expected failure for non-existent file")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("S3Downloader Example Usage")
    print("=" * 50)
    
    # Check if AWS credentials are configured
    if not (os.getenv('AWS_ACCESS_KEY_ID') or os.getenv('AWS_PROFILE')):
        print("⚠️  AWS credentials not found in environment variables")
        print("Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY")
        print("Or run 'aws configure' to set up AWS CLI")
        print("\nContinuing with examples (they will fail without credentials)...")
    
    main()
    
    # Uncomment to see other examples
    # example_with_credentials()
    # example_error_handling() 
# S3 File Downloader Script

A comprehensive Python script for downloading files from AWS S3 buckets with advanced features like progress tracking, batch downloads, and file filtering.

## Features

- ✅ **Single File Downloads**: Download individual files with progress tracking
- ✅ **Batch Downloads**: Download entire directories or filtered file sets
- ✅ **Progress Tracking**: Visual progress bars with tqdm
- ✅ **File Filtering**: Filter by file extensions (e.g., only images)
- ✅ **Directory Preservation**: Maintain folder structure when downloading
- ✅ **Error Handling**: Comprehensive error handling and logging
- ✅ **Download Reports**: Generate detailed reports of download operations
- ✅ **Flexible Credentials**: Support for environment variables, AWS CLI, or direct credentials
- ✅ **Resume Support**: Can resume interrupted downloads
- ✅ **Logging**: Detailed logging to both console and file

## Installation

### Prerequisites

- Python 3.7 or higher
- AWS account with S3 access
- AWS credentials configured

### Setup

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure AWS credentials** (choose one method):

   **Method 1: Environment Variables**
   ```bash
   export AWS_ACCESS_KEY_ID=your_access_key
   export AWS_SECRET_ACCESS_KEY=your_secret_key
   export AWS_DEFAULT_REGION=us-east-1
   ```

   **Method 2: AWS CLI**
   ```bash
   aws configure
   ```

   **Method 3: Direct in script**
   ```bash
   python s3_downloader.py --access-key YOUR_KEY --secret-key YOUR_SECRET
   ```

## Usage Examples

### Basic Operations

**List all accessible buckets**:
```bash
python s3_downloader.py --list-buckets
```

**List objects in a bucket**:
```bash
python s3_downloader.py --bucket my-bucket --list-objects
```

**List objects in a specific directory**:
```bash
python s3_downloader.py --bucket my-bucket --list-objects --prefix images/
```

### Download Operations

**Download a single file**:
```bash
python s3_downloader.py --bucket my-bucket --download-file path/to/file.jpg
```

**Download a single file to specific location**:
```bash
python s3_downloader.py --bucket my-bucket --download-file path/to/file.jpg --local-path /custom/path/image.jpg
```

**Download all files in a directory**:
```bash
python s3_downloader.py --bucket my-bucket --download-dir images/
```

**Download only image files**:
```bash
python s3_downloader.py --bucket my-bucket --download-dir images/ --extensions .jpg .png .gif .webp
```

**Download with custom output directory**:
```bash
python s3_downloader.py --bucket my-bucket --download-dir images/ --output-dir /path/to/downloads
```

**Limit number of files to download**:
```bash
python s3_downloader.py --bucket my-bucket --download-dir images/ --max-files 10
```

**Download with custom credentials**:
```bash
python s3_downloader.py --bucket my-bucket --download-dir images/ --access-key AKIA... --secret-key ... --region us-west-2
```

**Quiet mode (no progress bars)**:
```bash
python s3_downloader.py --bucket my-bucket --download-dir images/ --quiet
```

## Command Line Options

### AWS Configuration
- `--access-key`: AWS Access Key ID
- `--secret-key`: AWS Secret Access Key  
- `--region`: AWS region (default: us-east-1)

### Bucket Operations
- `--bucket`: S3 bucket name
- `--list-buckets`: List all accessible buckets
- `--list-objects`: List objects in bucket
- `--prefix`: Object key prefix for filtering

### Download Options
- `--download-file`: Download a specific file
- `--download-dir`: Download all files in a directory
- `--local-path`: Local path for downloaded file
- `--extensions`: File extensions to filter by (e.g., .jpg .png)
- `--max-files`: Maximum number of files to download

### Output Options
- `--output-dir`: Download directory (default: ./downloads)
- `--quiet`: Suppress progress bars

## Output Structure

### Download Directory
Files are downloaded to a `downloads/` directory (or custom directory specified with `--output-dir`):

```
downloads/
├── file1.jpg
├── file2.png
├── subdirectory/
│   ├── file3.gif
│   └── file4.webp
└── download_report.txt
```

### Log Files
- `s3_downloader.log`: Detailed operation log
- `download_report.txt`: Summary report of download operations

### Download Report Example
```
=== S3 Download Report ===
Timestamp: 2024-01-15 14:30:25
Bucket: my-image-bucket
Download Path: /path/to/downloads

Statistics:
- Total files processed: 25
- Successfully downloaded: 24
- Failed downloads: 1
- Success rate: 96.0%

Failed files:
  - images/corrupted-file.jpg
```

## Error Handling

The script handles various error scenarios:

- **Missing credentials**: Prompts to configure AWS credentials
- **Invalid bucket**: Reports bucket not found
- **Missing files**: Reports specific files not found
- **Network issues**: Retries and reports connection problems
- **Permission errors**: Reports access denied issues

## Integration with Existing S3 Demo

This script is designed to work with the existing S3 Image Demo project. You can use it to:

1. **Download uploaded images**: Use the same bucket as your demo
2. **Backup images**: Download all images for backup purposes
3. **Filter by type**: Download only specific image types
4. **Batch operations**: Process large numbers of images

### Example with Demo Bucket
```bash
# Download all images from your demo bucket
python s3_downloader.py --bucket your-s3-bucket-name --download-dir images/

# Download only JPG and PNG files
python s3_downloader.py --bucket your-s3-bucket-name --download-dir images/ --extensions .jpg .png
```

## Security Considerations

- **Credentials**: Never hardcode AWS credentials in scripts
- **IAM Permissions**: Use least-privilege access (s3:GetObject, s3:ListBucket)
- **Bucket Policies**: Ensure proper bucket access policies
- **Log Files**: Review log files for sensitive information

## Troubleshooting

### Common Issues

**"No credentials found"**
```bash
# Set environment variables
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret

# Or use AWS CLI
aws configure
```

**"Bucket not found"**
- Verify bucket name is correct
- Check AWS region matches bucket region
- Ensure you have access to the bucket

**"Access denied"**
- Check IAM permissions for S3 access
- Verify bucket policies allow your access
- Ensure credentials are valid

**"Download interrupted"**
- Script can be restarted to resume downloads
- Check network connectivity
- Verify sufficient disk space

### Debug Mode
For detailed debugging, check the log file:
```bash
tail -f s3_downloader.log
```

## Performance Tips

- **Large files**: Use `--quiet` mode for faster downloads
- **Many files**: Use `--max-files` to limit batch size
- **Network issues**: Consider using AWS CLI for large transfers
- **Disk space**: Monitor available space before large downloads

## Contributing

Feel free to enhance the script with additional features:

- Parallel downloads
- Compression support
- CloudFront integration
- Additional file format support
- GUI interface

## License

This script is provided as-is for educational and development purposes. 
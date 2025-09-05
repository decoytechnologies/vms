# Storage Configuration Guide

The VMS backend now supports both **AWS S3** and **Azure Blob Storage** for file uploads. The system will automatically detect which storage service is available and use it accordingly.

## Configuration Options

### Environment Variables

Add the following to your `.env` file:

```env
# Storage Configuration
STORAGE_TYPE=S3  # Options: 'S3' or 'AZURE'

# AWS S3 Configuration (required if STORAGE_TYPE=S3)
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-s3-bucket-name

# Azure Blob Storage Configuration (required if STORAGE_TYPE=AZURE)
AZURE_STORAGE_ACCOUNT_NAME=your_storage_account_name
AZURE_STORAGE_ACCOUNT_KEY=your_storage_account_key
AZURE_CONTAINER_NAME=vms-images
```

## Automatic Fallback

The system includes intelligent fallback functionality:

1. **Primary Storage**: Uses the storage type specified in `STORAGE_TYPE`
2. **Automatic Fallback**: If the primary storage fails to initialize, it automatically tries the other storage type
3. **Error Handling**: If both storage services fail, the server will not start and will display an error

## Supported Storage Types

### AWS S3
- **Advantages**: Mature service, extensive documentation, global availability
- **Requirements**: AWS account, S3 bucket, IAM credentials
- **Configuration**: Requires `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME`

### Azure Blob Storage
- **Advantages**: Integration with Microsoft ecosystem, competitive pricing
- **Requirements**: Azure account, Storage Account, access keys
- **Configuration**: Requires `AZURE_STORAGE_ACCOUNT_NAME`, `AZURE_STORAGE_ACCOUNT_KEY`, `AZURE_CONTAINER_NAME`

## Setup Instructions

### For AWS S3:

1. Create an S3 bucket in your AWS account
2. Create an IAM user with S3 permissions
3. Get the access key and secret key
4. Set `STORAGE_TYPE=S3` in your `.env` file
5. Add your AWS credentials to the `.env` file

### For Azure Blob Storage:

1. Create a Storage Account in Azure
2. Get the account name and access key
3. Set `STORAGE_TYPE=AZURE` in your `.env` file
4. Add your Azure credentials to the `.env` file
5. The container will be created automatically if it doesn't exist

## File Structure

Uploaded files are organized as follows:
```
/visitorPhoto/
  ├── timestamp-random.jpg
  └── timestamp-random.png
/idPhoto/
  ├── timestamp-random.jpg
  └── timestamp-random.png
```

## Features

- ✅ **Automatic Storage Detection**: Tries primary storage, falls back to secondary
- ✅ **Unified API**: Same code works with both storage types
- ✅ **Signed URLs**: Secure, time-limited access to files
- ✅ **File Validation**: Only image files are accepted
- ✅ **Error Handling**: Comprehensive error handling and logging
- ✅ **Performance**: Optimized for fast uploads and downloads

## Monitoring

The server logs will show:
- Which storage service is being used
- Storage initialization status
- Upload confirmations with storage type
- Any fallback operations

Example startup logs:
```
✅ Database connection has been established successfully.
✅ S3 storage initialized successfully
✅ Storage service initialized: S3 (Ready)
🚀 Server is listening on port 8080...
📁 Using S3 for file storage
```

## Troubleshooting

### Common Issues:

1. **"Missing AWS S3 configuration"**
   - Ensure all AWS environment variables are set
   - Check that the S3 bucket exists and is accessible

2. **"Missing Azure Blob Storage configuration"**
   - Ensure Azure storage account name and key are correct
   - Verify the storage account is in the correct region

3. **"No available storage service"**
   - Both storage services failed to initialize
   - Check your network connection and credentials
   - Verify the storage accounts/buckets exist

### Debug Steps:

1. Check the server startup logs for storage initialization messages
2. Verify your `.env` file has the correct credentials
3. Test your credentials manually using AWS CLI or Azure CLI
4. Check network connectivity to the storage services

## Migration

If you need to switch from one storage type to another:

1. Update the `STORAGE_TYPE` environment variable
2. Add the new storage service credentials
3. Restart the server
4. The system will automatically use the new storage service
5. Previously uploaded files will still be accessible through their original storage service

const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } = require('@azure/storage-blob');
const crypto = require('crypto');

class StorageService {
  constructor() {
    this.storageType = process.env.STORAGE_TYPE || 'S3'; // Default to S3
    this.initializeStorage();
  }

  async initializeStorage() {
    try {
      if (this.storageType.toUpperCase() === 'AZURE') {
        await this.initializeAzure();
      } else {
        await this.initializeS3();
      }
      console.log(`✅ ${this.storageType} storage initialized successfully`);
    } catch (error) {
      console.error(`❌ Failed to initialize ${this.storageType} storage:`, error.message);
      // Fallback to the other storage type
      try {
        if (this.storageType.toUpperCase() === 'AZURE') {
          console.log('🔄 Falling back to AWS S3...');
          this.storageType = 'S3';
          await this.initializeS3();
        } else {
          console.log('🔄 Falling back to Azure Blob Storage...');
          this.storageType = 'AZURE';
          await this.initializeAzure();
        }
        console.log(`✅ Fallback to ${this.storageType} storage successful`);
      } catch (fallbackError) {
        console.error('❌ Both storage services failed to initialize:', fallbackError.message);
        throw new Error('No available storage service');
      }
    }
  }

  async initializeS3() {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
      throw new Error('Missing AWS S3 configuration');
    }

    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    this.bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!this.bucketName) {
      throw new Error('Missing AWS S3 bucket name');
    }

    // Test connection
    await this.s3Client.send(new GetObjectCommand({
      Bucket: this.bucketName,
      Key: 'test-connection'
    })).catch(() => {
      // Expected to fail for non-existent key, but confirms bucket access
    });
  }

  async initializeAzure() {
    if (!process.env.AZURE_STORAGE_ACCOUNT_NAME || !process.env.AZURE_STORAGE_ACCOUNT_KEY) {
      throw new Error('Missing Azure Blob Storage configuration');
    }

    const credential = new StorageSharedKeyCredential(
      process.env.AZURE_STORAGE_ACCOUNT_NAME,
      process.env.AZURE_STORAGE_ACCOUNT_KEY
    );

    this.blobServiceClient = new BlobServiceClient(
      `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
      credential
    );

    this.containerName = process.env.AZURE_CONTAINER_NAME || 'vms-images';

    // Test connection and create container if it doesn't exist
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    await containerClient.createIfNotExists({
      access: 'blob'
    });
  }

  async uploadImage(buffer, originalName, folder = 'images') {
    const fileExtension = originalName.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${fileExtension}`;

    if (this.storageType.toUpperCase() === 'AZURE') {
      return await this.uploadToAzure(buffer, fileName);
    } else {
      return await this.uploadToS3(buffer, fileName);
    }
  }

  async uploadToS3(buffer, fileName) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: this.getContentType(fileName),
    });

    await this.s3Client.send(command);
    return {
      key: fileName,
      url: `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`,
      storageType: 'S3'
    };
  }

  async uploadToAzure(buffer, fileName) {
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: {
        blobContentType: this.getContentType(fileName)
      }
    });

    return {
      key: fileName,
      url: blockBlobClient.url,
      storageType: 'AZURE'
    };
  }

  async getSignedUrl(key, expiresIn = 300) {
    if (this.storageType.toUpperCase() === 'AZURE') {
      return await this.getAzureSignedUrl(key, expiresIn);
    } else {
      return await this.getS3SignedUrl(key, expiresIn);
    }
  }

  async getS3SignedUrl(key, expiresIn) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async getAzureSignedUrl(key, expiresIn) {
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(key);

    const startsOn = new Date();
    const expiresOn = new Date(startsOn.getTime() + expiresIn * 1000);

    const sasOptions = {
      containerName: this.containerName,
      blobName: key,
      permissions: BlobSASPermissions.parse('r'), // Read permission
      startsOn,
      expiresOn,
    };

    const credential = new StorageSharedKeyCredential(
      process.env.AZURE_STORAGE_ACCOUNT_NAME,
      process.env.AZURE_STORAGE_ACCOUNT_KEY
    );

    const sasToken = generateBlobSASQueryParameters(sasOptions, credential).toString();
    return `${blockBlobClient.url}?${sasToken}`;
  }

  getContentType(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };
    return mimeTypes[extension] || 'application/octet-stream';
  }

  getStorageInfo() {
    return {
      type: this.storageType,
      initialized: this.storageType.toUpperCase() === 'AZURE' ? !!this.blobServiceClient : !!this.s3Client
    };
  }
}

// Create singleton instance
const storageService = new StorageService();

module.exports = storageService;

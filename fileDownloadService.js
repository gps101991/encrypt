const { s3Client } = require('../config/aws.config')
const { GetObjectCommand } = require('@aws-sdk/client-s3')
const encryptionService = require('./encryptionService')

class FileDownloadService {
  async downloadAndDecryptFile(bucketName, key) {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      })

      const response = await s3Client.send(command)
      const encryptedBuffer = await response.Body.transformToByteArray()

      // Check if file is encrypted based on metadata
      const isEncrypted = response.Metadata?.encrypted === 'true'

      if (isEncrypted) {
        // Decrypt the file
        const decryptedBuffer = encryptionService.decryptFile(
          Buffer.from(encryptedBuffer)
        )
        return {
          buffer: decryptedBuffer,
          contentType:
            response.Metadata['original-mimetype'] || response.ContentType,
          originalName:
            response.Metadata['original-filename'] || key.split('/').pop(),
          encrypted: true,
          size: decryptedBuffer.length,
        }
      } else {
        // Return as-is if not encrypted (backward compatibility)
        return {
          buffer: Buffer.from(encryptedBuffer),
          contentType: response.ContentType,
          originalName: key.split('/').pop(),
          encrypted: false,
          size: encryptedBuffer.length,
        }
      }
    } catch (error) {
      console.error('File download error:', error)
      throw new Error(`Failed to download file: ${error.message}`)
    }
  }

  // Download file without decryption (for cases where you need the raw encrypted file)
  async downloadRawFile(bucketName, key) {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      })

      const response = await s3Client.send(command)
      const buffer = await response.Body.transformToByteArray()

      return {
        buffer: Buffer.from(buffer),
        contentType: response.ContentType,
        originalName: key.split('/').pop(),
        encrypted: response.Metadata?.encrypted === 'true',
        metadata: response.Metadata || {},
      }
    } catch (error) {
      console.error('Raw file download error:', error)
      throw new Error(`Failed to download raw file: ${error.message}`)
    }
  }

  // Check if a file is encrypted without downloading it
  async isFileEncrypted(bucketName, key) {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      })

      const response = await s3Client.send(command)
      return response.Metadata?.encrypted === 'true'
    } catch (error) {
      console.error('File check error:', error)
      return false
    }
  }

  // Get file metadata without downloading content
  async getFileMetadata(bucketName, key) {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      })

      const response = await s3Client.send(command)
      return {
        contentType: response.ContentType,
        originalName:
          response.Metadata?.['original-filename'] || key.split('/').pop(),
        encrypted: response.Metadata?.encrypted === 'true',
        originalMimeType: response.Metadata?.['original-mimetype'],
        size: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata || {},
      }
    } catch (error) {
      console.error('File metadata error:', error)
      throw new Error(`Failed to get file metadata: ${error.message}`)
    }
  }
}

module.exports = new FileDownloadService()














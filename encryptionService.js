const crypto = require('crypto')

class EncryptionService {
  constructor() {
    // Use environment variables for security
    this.algorithm = 'aes-256-cbc'
    this.secretKey = this.processSecretKey(
      process.env.ENCRYPTION_SECRET_KEY || this.generateDefaultKey()
    )
    this.ivLength = 16 // For CBC, this is always 16
  }

  // Process secret key to ensure it's the correct format
  processSecretKey(key) {
    if (typeof key === 'string') {
      // If it's a hex string, convert to buffer
      if (key.length === 64) {
        return Buffer.from(key, 'hex')
      }
      // If it's a regular string, hash it to get 32 bytes
      return crypto.createHash('sha256').update(key).digest()
    }
    // If it's already a buffer, ensure it's 32 bytes
    if (Buffer.isBuffer(key)) {
      if (key.length === 32) {
        return key
      }
      // Hash to get exactly 32 bytes
      return crypto.createHash('sha256').update(key).digest()
    }
    // Fallback: generate a new key
    return this.generateDefaultKey()
  }

  // Generate a default key if none provided (for development only)
  generateDefaultKey() {
    console.warn(
      'WARNING: Using default encryption key. Set ENCRYPTION_SECRET_KEY in environment variables for production.'
    )
    return crypto.randomBytes(32)
  }

  // Encrypt file buffer
  encryptFile(fileBuffer) {
    try {
      const iv = crypto.randomBytes(this.ivLength)
      const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv)

      let encrypted = cipher.update(fileBuffer)
      encrypted = Buffer.concat([encrypted, cipher.final()])

      // Combine IV + EncryptedData
      return Buffer.concat([iv, encrypted])
    } catch (error) {
      console.error('Encryption error:', error)
      throw new Error(`Failed to encrypt file: ${error.message}`)
    }
  }

  // Decrypt file buffer
  decryptFile(encryptedBuffer) {
    try {
      const iv = encryptedBuffer.slice(0, this.ivLength)
      const encrypted = encryptedBuffer.slice(this.ivLength)

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.secretKey,
        iv
      )

      let decrypted = decipher.update(encrypted)
      decrypted = Buffer.concat([decrypted, decipher.final()])

      return decrypted
    } catch (error) {
      console.error('Decryption error:', error)
      throw new Error(`Failed to decrypt file: ${error.message}`)
    }
  }

  // Check if buffer is encrypted (has proper structure)
  isEncrypted(buffer) {
    if (buffer.length < this.ivLength) {
      return false
    }

    // Check if it has the expected structure
    return buffer.length > 16 // IV + minimum encrypted data
  }

  // Generate a unique encryption key per file (optional)
  generateFileKey() {
    return crypto.randomBytes(32)
  }

  // Get encryption metadata
  getEncryptionMetadata() {
    return {
      algorithm: this.algorithm,
      keyLength: this.secretKey.length,
      ivLength: this.ivLength,
    }
  }
}

module.exports = new EncryptionService()

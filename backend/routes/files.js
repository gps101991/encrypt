const path = require('path')
const express = require('express')
const upload = require('../middleware/upload')
const encryptionService = require(path.join(__dirname, '../../encryptionService.js'))

const router = express.Router()

const ALLOWED_EXTENSIONS = new Set(['cer', 'key', 'p12', 'json', 'jks'])

function getFileExtension(fileName) {
  const parts = fileName.split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : ''
}

function isAllowedExtension(fileName) {
  const ext = getFileExtension(fileName)
  return ALLOWED_EXTENSIONS.has(ext)
}

router.post('/encrypt', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const { originalname, buffer } = req.file

    if (!isAllowedExtension(originalname)) {
      return res.status(400).json({ error: 'Unsupported file type' })
    }

    const encryptedBuffer = encryptionService.encryptFile(buffer)

    const downloadName = `${originalname}.enc`
    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`)
    res.setHeader('X-Encrypted', 'true')
    res.send(encryptedBuffer)
  } catch (err) {
    next(err)
  }
})

router.post('/decrypt', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const { originalname, buffer } = req.file

    // best-effort filename restoration
    let baseName = originalname
    if (baseName.toLowerCase().endsWith('.enc')) {
      baseName = baseName.slice(0, -4)
    } else {
      baseName = `${baseName}.decrypted`
    }

    const decryptedBuffer = encryptionService.decryptFile(buffer)

    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}"`)
    res.setHeader('X-Encrypted', 'false')
    res.send(decryptedBuffer)
  } catch (err) {
    next(err)
  }
})

module.exports = router



## Encrypt/Decrypt Tool

Angular + Express utility to encrypt and decrypt files using AES‑256‑CBC. It preserves the original filename and extension for both encrypted and decrypted downloads.

### Tech stack
- **Frontend**: Angular 17, Vite dev server, Bootstrap 5
- **Backend**: Node.js, Express, Multer (in‑memory), CORS, dotenv
- **Crypto**: Node `crypto` module via `encryptionService.js`

### Features
- Encrypt and decrypt locally via a simple web UI
- Preserves original filename and extension (no `.enc` suffix)
- Supported extensions: `.cer`, `.key`, `.p12`, `.json`, `.jks`, `.p8`
- Streams over HTTP with proper `Content-Disposition` so the browser downloads with the original name

---

## Getting started

### Prerequisites
- Node 18+ recommended

### Backend (API)
```bash
cd /Users/prasannasrinivasan/Workspace/encrypt/backend ; npm install
cp /Users/prasannasrinivasan/Workspace/encrypt/backend/.env.example /Users/prasannasrinivasan/Workspace/encrypt/backend/.env ;
sed -i '' "" /Users/prasannasrinivasan/Workspace/encrypt/backend/.env
# IMPORTANT: set the same key for both encryption and decryption
# You may also paste directly into .env with your editor.
npm run dev
```

Environment variables used by the backend:
```ini
PORT=4000
ALLOWED_ORIGIN=http://localhost:4200
ENCRYPTION_SECRET_KEY=9e96db70535b3689c94313e73da323ca915d44659f282a889e1845b4d29c452a
```

Health check:
```bash
curl -sS http://localhost:4000/health
```

### Frontend (Angular)
```bash
cd /Users/prasannasrinivasan/Workspace/encrypt/frontend ; npm install ; npx ng serve --port 4200
```

Open the UI at `http://localhost:4200`.

The frontend targets the API at `window.BACKEND_URL` set in `frontend/src/index.html` (defaults to `http://localhost:4000`).

---

## Usage

1) Go to Encrypt tab
- Choose a supported file (`.cer`, `.key`, `.p12`, `.json`, `.jks`, `.p8`)
- Click “Encrypt & Download”. The downloaded file name is identical to the uploaded one

2) Go to Decrypt tab
- Choose the encrypted file (it has the same original extension in this app)
- Click “Upload Encrypted & Download Decrypted”. The downloaded file name is identical to the uploaded one

Note: Decryption will only succeed if the server’s `ENCRYPTION_SECRET_KEY` matches the key used when the file was encrypted.

---

## API Reference

Base URL: `http://localhost:4000`

### POST /api/files/encrypt
- Body: `multipart/form-data` with field `file`
- Allowed extensions: `.cer,.key,.p12,.json,.jks,.p8`
- Response: `200 OK` with raw binary
- Headers:
  - `Content-Type: application/octet-stream`
  - `Content-Disposition: attachment; filename="<original-name>"`
  - `X-Encrypted: true`
  - CORS exposes `Content-Disposition, X-Encrypted`

Example:
```bash
curl -X POST \
  -F "file=@/path/to/Certificates.p12" \
  -OJ \
  http://localhost:4000/api/files/encrypt
```

### POST /api/files/decrypt
- Body: `multipart/form-data` with field `file`
- Response: `200 OK` with raw binary
- Headers:
  - `Content-Type: application/octet-stream`
  - `Content-Disposition: attachment; filename="<original-name>"`
  - `X-Encrypted: false`

Example:
```bash
curl -X POST \
  -F "file=@/path/to/Encrypted-Certificates.p12" \
  -OJ \
  http://localhost:4000/api/files/decrypt
```

Errors:
- `400 Bad Request`: unsupported extension, missing file, or corrupted input
- `500 Internal Server Error`: unexpected server error

---

## How encryption works (AES‑256‑CBC)

The implementation lives in `encryptionService.js`. Key points:

- Algorithm: AES‑256‑CBC
  - AES key length: 256 bits (32 bytes)
  - IV length: 16 bytes (required for CBC)

- Secret key handling (`processSecretKey`):
  - If `ENCRYPTION_SECRET_KEY` is a 64‑character hex string, it’s treated as a 32‑byte key (`Buffer.from(hex, 'hex')`).
  - If it’s any other string, it’s hashed with SHA‑256 to produce exactly 32 bytes.
  - If a `Buffer` is supplied and it’s not 32 bytes, it’s SHA‑256 hashed to 32 bytes.
  - If no key is provided, a random 32‑byte key is generated (not suitable for decrypting across restarts).

- IV generation:
  - For each encryption operation, a new random 16‑byte IV is generated using a cryptographically secure RNG (`crypto.randomBytes(16)`).

- File format written by encrypt:
  - The output is `IV || CIPHERTEXT` (a simple concatenation):
    - first 16 bytes: the IV
    - remaining bytes: AES‑CBC ciphertext of the original file

- Decryption:
  - Reads first 16 bytes as IV, uses the same derived AES‑256 key, and decrypts the remainder.
  - If the key differs from the one used at encryption time, decryption fails with a `bad decrypt` error.

### Pseudocode
```text
encrypt(fileBytes):
  iv = randomBytes(16)
  key = deriveKey(ENCRYPTION_SECRET_KEY)
  ciphertext = AES_256_CBC_Encrypt(key, iv, fileBytes)
  return iv || ciphertext

decrypt(encryptedBytes):
  iv = encryptedBytes[0:16]
  ciphertext = encryptedBytes[16:]
  key = deriveKey(ENCRYPTION_SECRET_KEY)
  return AES_256_CBC_Decrypt(key, iv, ciphertext)

deriveKey(secret):
  if secret is 64‑char hex: return hexToBytes(secret)
  else: return SHA256(secret)
```

### Security considerations
- Use a strong `ENCRYPTION_SECRET_KEY`. A 64‑char hex (32 random bytes) is ideal.
- Store secrets in environment variables. Avoid committing them to version control.
- The IV is public and unique per file. Never reuse the same IV with the same key for different plaintexts in CBC mode.
- If you rotate keys, previously encrypted files must be decrypted with the old key or re‑encrypted with the new key.

---

## Troubleshooting

- Decryption fails with `bad decrypt`:
  - The key is different from the one used to encrypt. Ensure the same `ENCRYPTION_SECRET_KEY` value is set on the server.

- Port already in use (EADDRINUSE: 4000):
  - Another server instance is running. Kill the process and restart:
  ```bash
  lsof -ti :4000 | xargs kill -9 ;
  cd /Users/prasannasrinivasan/Workspace/encrypt/backend ; npm run dev
  ```

- Browser download has wrong name:
  - Ensure the backend CORS config exposes headers and the response includes `Content-Disposition`. This repo already sets:
    - `exposedHeaders: ['Content-Disposition', 'X-Encrypted']`

- Angular zone error (NG0908):
  - `zone.js` must be imported. This repo imports it in `frontend/src/main.ts`.

---

## Project structure (high level)

```
encrypt/
  encryptionService.js        # AES‑256‑CBC implementation
  backend/
    server.js                 # Express API + CORS
    routes/files.js           # /encrypt and /decrypt endpoints
    middleware/upload.js      # Multer (memory) file upload
    .env.example              # Example env vars
  frontend/
    src/app/encrypt/...       # Encrypt page
    src/app/decrypt/...       # Decrypt page
    src/app/root.component.ts # Layout + nav
```

---

## Production notes
- Terminate TLS in front of the API (e.g., Nginx/Cloud provider) and serve over HTTPS only.
- Consider server‑side streaming for very large files; current setup buffers in memory for simplicity.
- Consider rate limits and authentication if exposing the API publicly.




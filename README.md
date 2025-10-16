## Encrypt/Decrypt Tool

Simple tool to encrypt/decrypt files using AES-256-CBC with a shared key. Frontend is Angular; backend is Express using the existing `encryptionService.js`.

### Supported file types
- cer, key, p12, json, jks (encryption step validates these). Decrypt accepts any `.enc` produced by this tool.

### Prerequisites
- Node 18+

### Backend setup
```bash
cd /Users/prasannasrinivasan/Workspace/encrypt/backend ; npm install
cp /Users/prasannasrinivasan/Workspace/encrypt/backend/.env.example /Users/prasannasrinivasan/Workspace/encrypt/backend/.env
# Edit .env and set ENCRYPTION_SECRET_KEY (use 64-char hex or a strong string)
npm run dev
```

Backend starts at `http://localhost:4000`.

### Frontend setup
```bash
cd /Users/prasannasrinivasan/Workspace/encrypt/frontend ; npm install
npx ng serve --port 4200
```

Open `http://localhost:4200`.

### Configuration
- Frontend uses `window.BACKEND_URL` from `src/index.html` (default `http://localhost:4000`).
- Allowed origins configured by `ALLOWED_ORIGIN` in backend `.env`.

### Notes
- Keep your `ENCRYPTION_SECRET_KEY` consistent between encryption and decryption.
- For production, set `ENCRYPTION_SECRET_KEY` via environment variables.



import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'

@Component({
  standalone: true,
  selector: 'app-decrypt',
  template: `
    <div class="card">
      <div class="card-header">Decrypt File</div>
      <div class="card-body">
        <form (submit)="onSubmit($event)">
          <div class="mb-3">
            <input type="file" class="form-control" (change)="onFileChange($event)" accept=".cer,.key,.p12,.json,.jks,.p8" />
          </div>
          <button class="btn btn-primary" [disabled]="!selectedFile || loading">
            {{ loading ? 'Decrypting...' : 'Upload Encrypted & Download Decrypted' }}
          </button>
        </form>
        <div class="text-muted mt-2">Upload the encrypted file (same extension as original). The download keeps the same name.</div>
        <div class="text-danger mt-2" *ngIf="error">{{ error }}</div>
      </div>
    </div>
  `,
  imports: [CommonModule],
})
export class DecryptComponent {
  selectedFile: File | null = null
  loading = false
  error = ''
  backendUrl = (window as any).BACKEND_URL || 'http://localhost:4000'

  constructor(private http: HttpClient) {}

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement
    this.selectedFile = input.files && input.files.length ? input.files[0] : null
  }

  onSubmit(event: Event) {
    event.preventDefault()
    if (!this.selectedFile) return
    this.error = ''
    this.loading = true

    const form = new FormData()
    form.append('file', this.selectedFile)

    this.http
      .post(`${this.backendUrl}/api/files/decrypt`, form, {
        responseType: 'blob',
        observe: 'response',
      })
      .subscribe({
        next: (resp) => {
          const blob = resp.body as Blob
          const dispo = resp.headers.get('Content-Disposition') || ''
          const match = /filename="?([^";]+)"?/i.exec(dispo || '')
          const filename = match ? match[1] : this.selectedFile!.name
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = filename
          a.click()
          window.URL.revokeObjectURL(url)
          this.loading = false
        },
        error: async (err) => {
          try {
            if (err?.error instanceof Blob) {
              const text = await (err.error as Blob).text()
              const data = JSON.parse(text)
              this.error = data?.error || 'Decryption failed'
            } else {
              this.error = err?.error?.error || err?.message || 'Decryption failed'
            }
          } catch {
            this.error = 'Decryption failed'
          }
          this.loading = false
        },
      })
  }
}



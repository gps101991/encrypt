import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'

@Component({
  standalone: true,
  selector: 'app-encrypt',
  template: `
    <div class="card">
      <div class="card-header">Encrypt File</div>
      <div class="card-body">
        <form (submit)="onSubmit($event)">
          <div class="mb-3">
            <input type="file" class="form-control" (change)="onFileChange($event)" />
          </div>
          <button class="btn btn-primary" [disabled]="!selectedFile || loading">
            {{ loading ? 'Encrypting...' : 'Encrypt & Download' }}
          </button>
        </form>
        <div class="text-muted mt-2">Allowed: .cer, .key, .p12, .json, .jks</div>
        <div class="text-danger mt-2" *ngIf="error">{{ error }}</div>
      </div>
    </div>
  `,
  imports: [CommonModule],
})
export class EncryptComponent {
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
      .post(`${this.backendUrl}/api/files/encrypt`, form, {
        responseType: 'blob',
        observe: 'response',
      })
      .subscribe({
        next: (resp) => {
          const blob = resp.body as Blob
          const dispo = resp.headers.get('Content-Disposition') || ''
          const match = /filename="?([^";]+)"?/i.exec(dispo || '')
          const filename = match ? match[1] : `${this.selectedFile!.name}.enc`
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = filename
          a.click()
          window.URL.revokeObjectURL(url)
          this.loading = false
        },
        error: (err) => {
          this.error = err?.error?.error || 'Encryption failed'
          this.loading = false
        },
      })
  }
}



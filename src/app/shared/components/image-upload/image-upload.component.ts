import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UploadService } from '@core/services/upload.service';
import { HttpEventType } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.scss'
})
export class ImageUploadComponent {
  @Input() tipo!: 'liga' | 'equipo' | 'jugador' | 'cedula';
  @Input() ligaId?: number;
  @Input() currentImageUrl?: string;
  @Input() label: string = 'Seleccionar imagen';
  
  @Output() imageUploaded = new EventEmitter<string>();
  @Output() uploadError = new EventEmitter<string>();

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  uploading = false;
  uploadProgress = 0;
  errorMessage = '';

  constructor(private uploadService: UploadService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Solo se permiten archivos de imagen';
        this.uploadError.emit(this.errorMessage);
        return;
      }

      // Validar tamaño (2MB máximo)
      if (file.size > 2 * 1024 * 1024) {
        this.errorMessage = 'La imagen no debe superar 2MB';
        this.uploadError.emit(this.errorMessage);
        return;
      }

      this.selectedFile = file;
      this.errorMessage = '';

      // Generar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);

      // Subir automáticamente
      this.uploadImage();
    }
  }

  uploadImage(): void {
    if (!this.selectedFile) return;

    this.uploading = true;
    this.uploadProgress = 0;

    this.uploadService.uploadImageWithProgress(this.selectedFile, this.tipo, this.ligaId)
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.uploadProgress = Math.round((100 * event.loaded) / event.total);
          } else if (event.type === HttpEventType.Response) {
            const response = event.body;
            if (response) {
              const fullUrl = this.uploadService.getFullImageUrl(response.url);
              this.currentImageUrl = fullUrl;
              this.previewUrl = null;
              this.selectedFile = null;
              this.imageUploaded.emit(fullUrl);
              this.uploading = false;
            }
          }
        },
        error: (error) => {
          console.error('Error al subir imagen:', error);
          this.errorMessage = error.error?.message || 'Error al subir la imagen';
          this.uploadError.emit(this.errorMessage);
          this.uploading = false;
          this.uploadProgress = 0;
        }
      });
  }

  clearImage(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.uploadProgress = 0;
    this.errorMessage = '';
  }

  get displayImageUrl(): string | null {
    if (this.previewUrl) return this.previewUrl;
    if (this.currentImageUrl) return this.uploadService.getFullImageUrl(this.currentImageUrl);
    return null;
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JugadorCampeonatosService } from '../jugador-campeonatos.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { AuthService } from '../../../core/services/auth.service';
import { JugadorCampeonato, ResumenReingreso } from '../jugador-campeonato.model';
import { MainNavComponent } from '../../../shared/components/main-nav/main-nav.component';

@Component({
  selector: 'app-jugador-campeonatos-pendientes',
  standalone: true,
  imports: [CommonModule, RouterModule, MainNavComponent, FormsModule],
  templateUrl: './jugador-campeonatos-pendientes.component.html',
  styleUrls: ['./jugador-campeonatos-pendientes.component.scss'],
})
export class JugadorCampeonatosPendientesComponent implements OnInit {
  habilitaciones: JugadorCampeonato[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';
  user$ = this.authService.currentUser$;
  showImageModal = false;
  modalImageUrl = '';
  searchTerm = '';
  showReviewModal = false;
  reviewLoading = false;
  reviewSaving = false;
  resumenReingreso: ResumenReingreso | null = null;
  motivoReingreso = '';
  referenciaReingreso = '';
  fechaBaja = '';
  motivoBaja = '';
  referenciaBaja = '';

  // Paginación
  Math = Math;
  currentPage = 1;
  pageSize = 6;
  pageSizeOptions = [6, 12, 24];

  get totalPages(): number {
    return Math.ceil(this.filteredHabilitaciones.length / this.pageSize);
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get paginatedHabilitaciones(): JugadorCampeonato[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredHabilitaciones.slice(start, start + this.pageSize);
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  constructor(
    private jugadorCampeonatosService: JugadorCampeonatosService,
    public permissions: PermissionsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadPendientes();
  }

  loadPendientes(): void {
    this.loading = true;
    this.errorMessage = '';
    this.jugadorCampeonatosService.getPendientes().subscribe({
      next: (habilitaciones) => {
        this.habilitaciones = habilitaciones;
        this.currentPage = 1;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading pendientes:', error);
        this.errorMessage = 'Error al cargar las habilitaciones pendientes';
        this.loading = false;
      },
    });
  }

  aprobar(id: number): void {
    if (confirm('¿Está seguro de aprobar esta habilitación?')) {
      this.jugadorCampeonatosService.aprobar(id).subscribe({
        next: () => {
          this.successMessage = 'Habilitación aprobada exitosamente';
          this.loadPendientes();
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          console.error('Error approving habilitacion:', error);
          this.errorMessage =
            error.error?.message || 'Error al aprobar la habilitación';
        },
      });
    }
  }

  revisarParaAprobar(id: number): void {
    this.showReviewModal = true;
    this.cargarResumen(id);
  }

  private cargarResumen(id: number): void {
    this.reviewLoading = true;
    this.errorMessage = '';
    this.jugadorCampeonatosService.getResumenReingreso(id).subscribe({
      next: (resumen) => {
        this.resumenReingreso = resumen;
        this.motivoReingreso = resumen.solicitud.motivoReingreso || '';
        this.referenciaReingreso = resumen.solicitud.referenciaReingreso || '';
        this.motivoBaja = resumen.antecedente?.motivoBaja || resumen.antecedente?.observaciones || '';
        this.referenciaBaja = resumen.antecedente?.referenciaBaja || '';
        this.reviewLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'No se pudo cargar la revision de la solicitud';
        this.reviewLoading = false;
        this.showReviewModal = false;
      },
    });
  }

  regularizarReingreso(): void {
    const resumen = this.resumenReingreso;
    if (!resumen?.antecedente || !this.motivoReingreso.trim()) return;
    this.reviewSaving = true;
    this.jugadorCampeonatosService.regularizarReingreso(resumen.solicitud.id, {
      habilitacionOrigenId: resumen.antecedente.id,
      motivoReingreso: this.motivoReingreso.trim(),
      referenciaReingreso: this.referenciaReingreso.trim() || undefined,
      fechaBaja: this.fechaBaja || undefined,
      motivoBaja: this.motivoBaja.trim() || undefined,
      referenciaBaja: this.referenciaBaja.trim() || undefined,
    }).subscribe({
      next: () => {
        this.successMessage = 'La solicitud quedo vinculada con la baja anterior.';
        this.reviewSaving = false;
        this.cargarResumen(resumen.solicitud.id);
        this.loadPendientes();
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'No se pudo regularizar el reingreso';
        this.reviewSaving = false;
      },
    });
  }

  aprobarRevisada(): void {
    const resumen = this.resumenReingreso;
    if (!resumen || resumen.requiereRegularizacion) return;
    if (!confirm('Esta seguro de aprobar esta habilitacion?')) return;
    this.reviewSaving = true;
    this.jugadorCampeonatosService.aprobar(resumen.solicitud.id).subscribe({
      next: () => {
        this.successMessage = resumen.esReingreso
          ? 'Reingreso aprobado exitosamente'
          : 'Habilitacion aprobada exitosamente';
        this.closeReviewModal();
        this.loadPendientes();
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Error al aprobar la habilitacion';
        this.reviewSaving = false;
      },
    });
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
    this.resumenReingreso = null;
    this.reviewLoading = false;
    this.reviewSaving = false;
    this.motivoReingreso = '';
    this.referenciaReingreso = '';
    this.fechaBaja = '';
    this.motivoBaja = '';
    this.referenciaBaja = '';
  }

  rechazar(id: number): void {
    const observaciones = prompt(
      'Ingrese el motivo del rechazo. El dirigente podrá volver a solicitar la habilitación corrigiendo los detalles:'
    );
    if (observaciones !== null) {
      this.jugadorCampeonatosService
        .rechazar(id, observaciones)
        .subscribe({
          next: () => {
            this.successMessage = 'Habilitación rechazada. El jugador podrá ser habilitado nuevamente con una nueva solicitud.';
            this.loadPendientes();
            setTimeout(() => {
              this.successMessage = '';
            }, 5000);
          },
          error: (error) => {
            console.error('Error rejecting habilitacion:', error);
            this.errorMessage =
              error.error?.message || 'Error al rechazar la habilitación';
          },
        });
    }
  }

  get filteredHabilitaciones(): JugadorCampeonato[] {
    if (!this.searchTerm.trim()) {
      return this.habilitaciones;
    }

    const term = this.searchTerm.toLowerCase().trim();
    return this.habilitaciones.filter(h => 
      h.jugador?.nombre?.toLowerCase().includes(term) ||
      h.jugador?.cedula?.toLowerCase().includes(term)
    );
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
  }

  logout(): void {
    this.authService.logout();
  }

  openImageModal(imageUrl: string): void {
    this.modalImageUrl = imageUrl;
    this.showImageModal = true;
  }

  closeImageModal(): void {
    this.showImageModal = false;
    this.modalImageUrl = '';
  }
}

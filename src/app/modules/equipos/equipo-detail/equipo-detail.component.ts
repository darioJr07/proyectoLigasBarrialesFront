import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EquiposService } from '../../../core/services/equipos.service';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { Equipo } from '../../../core/models/equipo.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-equipo-detail',
  templateUrl: './equipo-detail.component.html',
  styleUrl: './equipo-detail.component.scss'
})
export class EquipoDetailComponent implements OnInit {
  equipo: Equipo | null = null;
  loading = false;
  errorMessage = '';
  user$ = this.authService.currentUser$;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private equiposService: EquiposService,
    public authService: AuthService,
    public permissions: PermissionsService
  ) {}

  ngOnInit(): void {
    this.loadEquipo();
  }

  loadEquipo(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorMessage = 'ID de equipo inválido';
      return;
    }

    this.loading = true;
    this.equiposService.getById(id).subscribe({
      next: (equipo) => {
        this.equipo = equipo;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Error al cargar el equipo';
        this.loading = false;
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/equipos']);
  }

  editEquipo(): void {
    if (this.equipo) {
      this.router.navigate(['/equipos/edit', this.equipo.id]);
    }
  }

  logout(): void {
    this.authService.logout();
  }
}

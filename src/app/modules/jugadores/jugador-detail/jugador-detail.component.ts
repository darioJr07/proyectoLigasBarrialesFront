import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { JugadoresService } from '../../../core/services/jugadores.service';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { Jugador } from '../../../core/models/jugador.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-jugador-detail',
  templateUrl: './jugador-detail.component.html',
  styleUrl: './jugador-detail.component.scss'
})
export class JugadorDetailComponent implements OnInit {
  jugador: Jugador | null = null;
  loading = false;
  errorMessage = '';
  user$ = this.authService.currentUser$;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private jugadoresService: JugadoresService,
    public authService: AuthService,
    public permissions: PermissionsService
  ) {}

  ngOnInit(): void {
    this.loadJugador();
  }

  loadJugador(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorMessage = 'ID de jugador inválido';
      return;
    }

    this.loading = true;
    this.jugadoresService.getById(id).subscribe({
      next: (jugador) => {
        this.jugador = jugador;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Error al cargar el jugador';
        this.loading = false;
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/jugadores']);
  }

  editJugador(): void {
    if (this.jugador) {
      this.router.navigate(['/jugadores/edit', this.jugador.id]);
    }
  }

  logout(): void {
    this.authService.logout();
  }
}

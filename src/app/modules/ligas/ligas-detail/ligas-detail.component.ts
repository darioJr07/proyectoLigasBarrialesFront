import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LigasService } from '../../../core/services/ligas.service';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { Liga } from '../../../core/models/liga.model';

@Component({
  selector: 'app-ligas-detail',
  templateUrl: './ligas-detail.component.html',
  styleUrl: './ligas-detail.component.scss'
})
export class LigasDetailComponent implements OnInit {
  liga: Liga | null = null;
  loading = false;
  errorMessage = '';
  isMaster = false;
  user$ = this.authService.currentUser$;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ligasService: LigasService,
    public authService: AuthService,
    public permissions: PermissionsService
  ) {}

  ngOnInit(): void {
    this.checkUserRole();
    this.loadLiga();
  }

  checkUserRole(): void {
    const currentUser = this.authService.getCurrentUser();
    this.isMaster = currentUser?.rol?.nombre === 'master';
  }

  loadLiga(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorMessage = 'ID de liga inválido';
      return;
    }

    this.loading = true;
    this.ligasService.getById(id).subscribe({
      next: (liga) => {
        this.liga = liga;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Error al cargar la liga';
        this.loading = false;
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/ligas']);
  }

  editLiga(): void {
    if (this.liga) {
      this.router.navigate(['/ligas', this.liga.id, 'editar']);
    }
  }

  logout(): void {
    this.authService.logout();
  }
}

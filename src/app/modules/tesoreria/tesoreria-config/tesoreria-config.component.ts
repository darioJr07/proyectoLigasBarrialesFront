import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { TesoreriaService, ConfigVocaliaItem } from '../../../core/services/tesoreria.service';
import { LigasService } from '../../../core/services/ligas.service';
import { MainNavComponent } from '../../../shared/components/main-nav/main-nav.component';

@Component({
  selector: 'app-tesoreria-config',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MainNavComponent],
  templateUrl: './tesoreria-config.component.html',
  styleUrl: './tesoreria-config.component.scss',
})
export class TesoreriaConfigComponent implements OnInit {
  user$: Observable<any>;

  ligas: any[]                  = [];
  filtroLigaId: number | null   = null;
  items: ConfigVocaliaItem[]    = [];

  loading   = false;
  guardando = false;
  error     = '';
  exito     = '';

  constructor(
    private authService: AuthService,
    public permissions: PermissionsService,
    private tesoreriaService: TesoreriaService,
    private ligasService: LigasService,
  ) {
    this.user$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.ligasService.getAll().subscribe({
      next: (ligas) => {
        this.ligas = ligas;
        const user = this.authService.currentUserValue;
        if (user?.ligaId) {
          this.filtroLigaId = user.ligaId;
          this.cargarConfig();
        }
      },
      error: () => {},
    });
  }

  cargarConfig(): void {
    if (!this.filtroLigaId) { return; }
    this.loading = true;
    this.error   = '';
    this.tesoreriaService.getConfigVocalia(this.filtroLigaId).subscribe({
      next: (config) => {
        this.items   = config.map((c) => ({ ...c, monto: Number(c.monto) }));
        this.loading = false;
      },
      error: (err) => {
        this.error   = err?.error?.message ?? 'Error al cargar la configuración';
        this.loading = false;
      },
    });
  }

  agregarItem(): void {
    this.items.push({
      nombre: '',
      monto: 0,
      orden: this.items.length + 1,
      activo: true,
    });
  }

  quitarItem(idx: number): void {
    this.items.splice(idx, 1);
    this.items.forEach((item, i) => { item.orden = i + 1; });
  }

  guardar(): void {
    if (!this.filtroLigaId) { return; }
    if (this.items.some((i) => !i.nombre.trim())) {
      this.error = 'Todos los ítems deben tener un nombre.';
      return;
    }
    this.guardando = true;
    this.error     = '';
    this.tesoreriaService.guardarConfigVocalia(this.filtroLigaId, this.items).subscribe({
      next: (saved) => {
        this.items     = saved.map((c) => ({ ...c, monto: Number(c.monto) }));
        this.guardando = false;
        this.exito     = '¡Configuración guardada correctamente!';
        setTimeout(() => { this.exito = ''; }, 3000);
      },
      error: (err) => {
        this.guardando = false;
        this.error     = err?.error?.message ?? 'Error al guardar la configuración';
      },
    });
  }

  logout(): void { this.authService.logout(); }
}

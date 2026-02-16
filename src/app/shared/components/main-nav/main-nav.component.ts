import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PermissionsService } from '@core/services/permissions.service';

/**
 * Componente centralizado de navegación principal
 * Se usa en todas las vistas para mantener consistencia
 * Controla la visibilidad de módulos según el rol del usuario
 */
@Component({
  selector: 'app-main-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './main-nav.component.html',
  styleUrl: './main-nav.component.scss'
})
export class MainNavComponent {
  constructor(public permissions: PermissionsService) {}
}

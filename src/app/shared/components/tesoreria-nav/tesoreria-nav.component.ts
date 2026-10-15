import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PermissionsService } from '../../../core/services/permissions.service';

@Component({
  selector: 'app-tesoreria-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tesoreria-nav.component.html',
  styleUrl: './tesoreria-nav.component.scss',
})
export class TesoreriaNavComponent {
  constructor(public permissions: PermissionsService) {}
}

import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Guard para validar roles y permisos de acceso
 * Implementa control de acceso basado en roles (RBAC)
 */
@Injectable({
  providedIn: 'root',
})
export class RolesGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    const currentUser = this.authService.currentUserValue;
    
    if (!currentUser) {
      this.router.navigate(['/login']);
      return false;
    }

    const allowedRoles = route.data['roles'] as string[];
    
    // Si no se especifican roles, permitir acceso (solo requiere autenticación)
    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    // Verificar si el rol del usuario está en los roles permitidos
    if (allowedRoles.includes(currentUser.rol.nombre)) {
      return true;
    }

    // Usuario no tiene permiso, redirigir al dashboard
    this.router.navigate(['/dashboard']);
    return false;
  }
}

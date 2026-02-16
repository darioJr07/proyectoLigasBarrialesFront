import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionsService } from '@core/services/permissions.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
})
export class ChangePasswordComponent implements OnInit {
  passwordForm: FormGroup;
  usuarioId: number | null = null;
  usuarioNombre = '';
  loading = false;
  user$ = this.authService.currentUser$;

  constructor(
    private fb: FormBuilder,
    private usuariosService: UsuariosService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    public permissions: PermissionsService
  ) {
    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.usuarioId = +id;
      this.loadUsuario(this.usuarioId);
    } else {
      alert('ID de usuario no válido');
      this.router.navigate(['/usuarios']);
    }
  }

  loadUsuario(id: number): void {
    this.usuariosService.getUsuario(id).subscribe({
      next: (usuario) => {
        this.usuarioNombre = usuario.nombre;
      },
      error: (error) => {
        console.error('Error al cargar usuario:', error);
        alert('Error al cargar usuario');
        this.router.navigate(['/usuarios']);
      },
    });
  }

  onSubmit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const newPassword = this.passwordForm.get('newPassword')?.value;
    const confirmPassword = this.passwordForm.get('confirmPassword')?.value;

    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (!this.usuarioId) {
      alert('ID de usuario no válido');
      return;
    }

    this.loading = true;
    this.usuariosService.changePassword(this.usuarioId, { newPassword }).subscribe({
      next: () => {
        alert('Contraseña actualizada correctamente');
        this.router.navigate(['/usuarios']);
      },
      error: (error) => {
        console.error('Error al cambiar contraseña:', error);
        alert(error.error?.message || 'Error al cambiar contraseña');
        this.loading = false;
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/usuarios']);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.passwordForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength']?.requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }
    return '';
  }

  passwordsMatch(): boolean {
    const newPassword = this.passwordForm.get('newPassword')?.value;
    const confirmPassword = this.passwordForm.get('confirmPassword')?.value;
    return newPassword === confirmPassword || !confirmPassword;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

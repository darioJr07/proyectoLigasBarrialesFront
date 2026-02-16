import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UsuariosRoutingModule } from './usuarios-routing.module';
import { UsuariosListComponent } from '../../features/usuarios/usuarios-list/usuarios-list.component';
import { UsuarioFormComponent } from '../../features/usuarios/usuario-form/usuario-form.component';
import { ChangePasswordComponent } from '../../features/usuarios/change-password/change-password.component';
import { MainNavComponent } from '../../shared/components/main-nav/main-nav.component';

@NgModule({
  declarations: [
    UsuariosListComponent,
    UsuarioFormComponent,
    ChangePasswordComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    UsuariosRoutingModule,
    MainNavComponent,
  ],
})
export class UsuariosModule {}

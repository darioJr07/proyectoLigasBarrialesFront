import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UsuariosListComponent } from '../../features/usuarios/usuarios-list/usuarios-list.component';
import { UsuarioFormComponent } from '../../features/usuarios/usuario-form/usuario-form.component';
import { ChangePasswordComponent } from '../../features/usuarios/change-password/change-password.component';

const routes: Routes = [
  {
    path: '',
    component: UsuariosListComponent,
  },
  {
    path: 'nuevo',
    component: UsuarioFormComponent,
  },
  {
    path: 'editar/:id',
    component: UsuarioFormComponent,
  },
  {
    path: 'cambiar-password/:id',
    component: ChangePasswordComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UsuariosRoutingModule {}

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EquiposListComponent } from './equipos-list/equipos-list.component';
import { EquipoFormComponent } from './equipo-form/equipo-form.component';
import { EquipoDetailComponent } from './equipo-detail/equipo-detail.component';

const routes: Routes = [
  {
    path: '',
    component: EquiposListComponent
  },
  {
    path: 'new',
    component: EquipoFormComponent
  },
  {
    path: 'edit/:id',
    component: EquipoFormComponent
  },
  {
    path: ':id',
    component: EquipoDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EquiposRoutingModule { }

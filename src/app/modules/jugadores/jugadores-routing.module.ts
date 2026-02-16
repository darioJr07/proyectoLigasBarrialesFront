import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { JugadoresListComponent } from './jugadores-list/jugadores-list.component';
import { JugadorFormComponent } from './jugador-form/jugador-form.component';
import { JugadorDetailComponent } from './jugador-detail/jugador-detail.component';

const routes: Routes = [
  {
    path: '',
    component: JugadoresListComponent
  },
  {
    path: 'new',
    component: JugadorFormComponent
  },
  {
    path: 'edit/:id',
    component: JugadorFormComponent
  },
  {
    path: ':id',
    component: JugadorDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class JugadoresRoutingModule { }

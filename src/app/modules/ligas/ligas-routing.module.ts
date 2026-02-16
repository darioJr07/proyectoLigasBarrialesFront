import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LigasListComponent } from './ligas-list/ligas-list.component';
import { LigaFormComponent } from './liga-form/liga-form.component';
import { LigasDetailComponent } from './ligas-detail/ligas-detail.component';

const routes: Routes = [
  {
    path: '',
    component: LigasListComponent,
  },
  {
    path: 'nueva',
    component: LigaFormComponent,
  },
  {
    path: ':id',
    component: LigasDetailComponent,
  },
  {
    path: ':id/editar',
    component: LigaFormComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LigasRoutingModule {}

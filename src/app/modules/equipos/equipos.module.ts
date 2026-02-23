import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { EquiposRoutingModule } from './equipos-routing.module';
import { EquiposListComponent } from './equipos-list/equipos-list.component';
import { EquipoFormComponent } from './equipo-form/equipo-form.component';
import { EquipoDetailComponent } from './equipo-detail/equipo-detail.component';
import { ImageUploadComponent } from '../../shared/components/image-upload/image-upload.component';
import { MainNavComponent } from '../../shared/components/main-nav/main-nav.component';

@NgModule({
  declarations: [
    EquiposListComponent,
    EquipoFormComponent,
    EquipoDetailComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    EquiposRoutingModule,
    ImageUploadComponent,
    MainNavComponent
  ]
})
export class EquiposModule { }

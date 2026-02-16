import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LigasRoutingModule } from './ligas-routing.module';
import { LigasListComponent } from './ligas-list/ligas-list.component';
import { LigaFormComponent } from './liga-form/liga-form.component';
import { LigasDetailComponent } from './ligas-detail/ligas-detail.component';
import { ImageUploadComponent } from '../../shared/components/image-upload/image-upload.component';
import { MainNavComponent } from '../../shared/components/main-nav/main-nav.component';

@NgModule({
  declarations: [
    LigasListComponent,
    LigaFormComponent,
    LigasDetailComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LigasRoutingModule,
    ImageUploadComponent,
    MainNavComponent,
  ],
})
export class LigasModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { PublicoInicioComponent } from './publico-inicio.component';
import { PublicoLigaComponent } from './publico-liga.component';
import { PublicoPosicionesComponent } from './publico-posiciones.component';
import { PublicoResultadosComponent } from './publico-resultados.component';
import { PublicoGoleadoresComponent } from './publico-goleadores.component';
import { PublicoSancionesComponent } from './publico-sanciones.component';

const routes: Routes = [
  { path: ':ligaId/campeonato/:campeonatoId/posiciones', component: PublicoPosicionesComponent },
  { path: ':ligaId/campeonato/:campeonatoId/resultados', component: PublicoResultadosComponent },
  { path: ':ligaId/campeonato/:campeonatoId/goleadores', component: PublicoGoleadoresComponent },
  { path: ':ligaId/campeonato/:campeonatoId/sanciones', component: PublicoSancionesComponent },
  { path: '', component: PublicoInicioComponent },
  { path: ':ligaId', component: PublicoLigaComponent },
];

@NgModule({
  declarations: [PublicoInicioComponent, PublicoLigaComponent, PublicoPosicionesComponent, PublicoResultadosComponent, PublicoGoleadoresComponent, PublicoSancionesComponent],
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class PublicoModule {}

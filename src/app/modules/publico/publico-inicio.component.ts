import { Component, OnInit } from '@angular/core';
import { PublicoService, LigaPublica } from './publico.service';

@Component({
  selector: 'app-publico-inicio',
  templateUrl: './publico-inicio.component.html',
  styleUrls: ['./publico.component.scss'],
})
export class PublicoInicioComponent implements OnInit {
  ligas: LigaPublica[] = [];
  cargando = true;
  error = '';

  constructor(private readonly publicoService: PublicoService) {}

  ngOnInit(): void {
    this.publicoService.listarLigas().subscribe({
      next: ligas => { this.ligas = ligas; this.cargando = false; },
      error: () => { this.error = 'No se pudo cargar la información pública.'; this.cargando = false; },
    });
  }
}

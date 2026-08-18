import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CampeonatoPublico, LigaPublica, PublicoService } from './publico.service';

@Component({
  selector: 'app-publico-liga',
  templateUrl: './publico-liga.component.html',
  styleUrls: ['./publico.component.scss'],
})
export class PublicoLigaComponent implements OnInit {
  liga?: LigaPublica;
  campeonatos: CampeonatoPublico[] = [];
  cargando = true;
  error = '';

  constructor(private readonly route: ActivatedRoute, private readonly publicoService: PublicoService) {}

  ngOnInit(): void {
    const ligaId = Number(this.route.snapshot.paramMap.get('ligaId'));
    if (!ligaId) { this.error = 'Liga no válida.'; this.cargando = false; return; }

    this.publicoService.listarLigas().subscribe({
      next: ligas => {
        this.liga = ligas.find(liga => liga.id === ligaId);
        if (!this.liga) { this.error = 'Liga pública no encontrada.'; this.cargando = false; return; }
        this.publicoService.listarCampeonatos(ligaId).subscribe({
          next: campeonatos => { this.campeonatos = campeonatos; this.cargando = false; },
          error: () => { this.error = 'No se pudo cargar el campeonato.'; this.cargando = false; },
        });
      },
      error: () => { this.error = 'No se pudo cargar la liga.'; this.cargando = false; },
    });
  }
}

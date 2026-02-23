import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TransferenciasService } from '../transferencias.service';
import { CampeonatosService } from '../../campeonatos/campeonatos.service';
import { JugadorCampeonatosService } from '../../jugador-campeonatos/jugador-campeonatos.service';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { CreateTransferenciaDto } from '../transferencia.model';
import { Campeonato } from '../../campeonatos/campeonato.model';
import { JugadorCampeonato } from '../../jugador-campeonatos/jugador-campeonato.model';
import { MainNavComponent } from '../../../shared/components/main-nav/main-nav.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-transferencia-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MainNavComponent,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './transferencia-form.component.html',
  styleUrls: ['./transferencia-form.component.scss'],
})
export class TransferenciaFormComponent implements OnInit {
  form: FormGroup;
  campeonatos: Campeonato[] = [];
  jugadoresHabilitados: JugadorCampeonato[] = [];
  jugadorSearchControl = new FormControl('');
  filteredJugadores$: Observable<JugadorCampeonato[]> | undefined;
  loading = false;
  errorMessage = '';
  currentEquipoId: number | null = null;
  user$ = this.authService.currentUser$;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private transferenciasService: TransferenciasService,
    private campeonatosService: CampeonatosService,
    private jugadorCampeonatosService: JugadorCampeonatosService,
    private authService: AuthService,
    public permissions: PermissionsService
  ) {
    this.form = this.fb.group({
      campeonatoId: ['', Validators.required],
      jugadorCampeonatoId: ['', Validators.required],
      observaciones: [''],
    });
  }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    this.currentEquipoId = currentUser?.equipoId || null;

    if (!this.currentEquipoId) {
      this.errorMessage =
        'Debe estar asociado a un equipo para solicitar transferencias';
      return;
    }

    this.loadCampeonatos();

    // Cargar jugadores cuando se seleccione un campeonato
    this.form.get('campeonatoId')?.valueChanges.subscribe((campeonatoId) => {
      if (campeonatoId) {
        // Resetear el campo de búsqueda y la selección de jugador
        this.jugadorSearchControl.setValue('');
        this.form.patchValue({ jugadorCampeonatoId: '' });
        this.loadJugadoresHabilitados(campeonatoId);
      }
    });
  }

  loadCampeonatos(): void {
    this.campeonatosService.getAll().subscribe({
      next: (campeonatos) => {
        // Campeonatos activos donde pueden haber transferencias
        this.campeonatos = campeonatos.filter(
          (c) => c.activo && (c.estado === 'inscripcion_abierta' || c.estado === 'en_curso')
        );
        
        console.log('Campeonatos cargados:', this.campeonatos);
      },
      error: (error) => {
        console.error('Error loading campeonatos:', error);
        this.errorMessage = 'Error al cargar los campeonatos';
      },
    });
  }

  loadJugadoresHabilitados(campeonatoId: number): void {
    this.jugadorCampeonatosService.getDisponiblesParaTransferencia(campeonatoId).subscribe({
      next: (habilitaciones) => {
        this.jugadoresHabilitados = habilitaciones;
        
        // Inicializar el filtro de búsqueda
        this.filteredJugadores$ = this.jugadorSearchControl.valueChanges.pipe(
          startWith(''),
          map((value) => this._filterJugadores(value || ''))
        );
        
        console.log('Jugadores disponibles para transferencia:', this.jugadoresHabilitados);
      },
      error: (error) => {
        console.error('Error loading jugadores disponibles:', error);
        this.errorMessage = 'Error al cargar los jugadores disponibles para transferencia';
      },
    });
  }

  onSubmit(): void {
    if (this.form.valid && this.currentEquipoId) {
      this.loading = true;
      this.errorMessage = '';

      // El valor del select ahora es directamente el jugadorId
      const jugadorId = Number(this.form.value.jugadorCampeonatoId);

      if (!jugadorId) {
        this.errorMessage = 'No se encontró el jugador seleccionado';
        this.loading = false;
        return;
      }

      const createDto: CreateTransferenciaDto = {
        jugadorId: jugadorId,
        campeonatoId: Number(this.form.value.campeonatoId),
        equipoDestinoId: this.currentEquipoId,
        observaciones: this.form.value.observaciones,
      };

      this.transferenciasService.create(createDto).subscribe({
        next: () => {
          this.router.navigate(['/transferencias']);
        },
        error: (error) => {
          console.error('Error creating transferencia:', error);
          this.errorMessage =
            error.error?.message || 'Error al crear la solicitud de transferencia';
          this.loading = false;
        },
      });
    } else {
      this.markFormGroupTouched(this.form);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    this.router.navigate(['/transferencias']);
  }

  logout(): void {
    this.authService.logout();
  }

  private _filterJugadores(value: string): JugadorCampeonato[] {
    if (!value || typeof value !== 'string') {
      return this.jugadoresHabilitados;
    }

    const filterValue = value.toLowerCase();
    return this.jugadoresHabilitados.filter((habilitacion) => {
      const jugador = habilitacion.jugador;
      const equipo = habilitacion.equipo;
      const nombreCompleto = jugador?.nombre?.toLowerCase() || '';
      const cedula = jugador?.cedula?.toLowerCase() || '';
      const nombreEquipo = equipo?.nombre?.toLowerCase() || '';

      return (
        nombreCompleto.includes(filterValue) ||
        cedula.includes(filterValue) ||
        nombreEquipo.includes(filterValue)
      );
    });
  }

  displayJugador(jugadorCampeonato: JugadorCampeonato | null): string {
    if (!jugadorCampeonato) return '';
    return this.getJugadorInfo(jugadorCampeonato);
  }

  onJugadorSelected(jugadorCampeonato: JugadorCampeonato): void {
    if (jugadorCampeonato?.jugador?.id) {
      this.form.patchValue({
        jugadorCampeonatoId: jugadorCampeonato.jugador.id,
      });
    }
  }

  getJugadorInfo(jugadorCampeonato: JugadorCampeonato): string {
    const jugador = jugadorCampeonato.jugador;
    const equipo = jugadorCampeonato.equipo;
    return `${jugador?.nombre} (${jugador?.cedula}) - ${equipo?.nombre}`;
  }
}

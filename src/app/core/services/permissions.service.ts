import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Servicio para gestionar permisos basados en roles
 * Centraliza la lógica de autorización
 */
@Injectable({
  providedIn: 'root',
})
export class PermissionsService {
  constructor(private authService: AuthService) {}

  /**
   * Verifica si el usuario tiene uno de los roles especificados
   */
  hasRole(roles: string[]): boolean {
    const user = this.authService.currentUserValue;
    return !!(user && roles.includes(user.rol.nombre));
  }

  /**
   * Verifica si el usuario es master
   */
  isMaster(): boolean {
    return this.hasRole(['master']);
  }

  /**
   * Verifica si el usuario es directivo de liga
   */
  isDirectivo(): boolean {
    return this.hasRole(['directivo_liga']);
  }

  /**
   * Verifica si el usuario es dirigente de equipo
   */
  isDirigente(): boolean {
    return this.hasRole(['dirigente_equipo']);
  }

  /**
   * Verifica si puede acceder al módulo de ligas
   */
  canAccessLigas(): boolean {
    return this.hasRole(['master', 'directivo_liga']);
  }

  /**
   * Verifica si puede acceder al módulo de equipos
   */
  canAccessEquipos(): boolean {
    return this.hasRole(['master', 'directivo_liga', 'dirigente_equipo']);
  }

  /**
   * Verifica si puede acceder al módulo de jugadores
   */
  canAccessJugadores(): boolean {
    return this.hasRole(['master', 'directivo_liga', 'dirigente_equipo']);
  }

  /**
   * Verifica si puede acceder al módulo de usuarios
   */
  canAccessUsuarios(): boolean {
    return this.hasRole(['master', 'directivo_liga']);
  }

  /**
   * Verifica si puede crear una liga
   */
  canCreateLiga(): boolean {
    return this.isMaster();
  }

  /**
   * Verifica si puede editar una liga
   */
  canEditLiga(): boolean {
    return this.hasRole(['master', 'directivo_liga']);
  }

  /**
   * Verifica si puede eliminar una liga
   */
  canDeleteLiga(): boolean {
    return this.isMaster();
  }

  /**
   * Verifica si puede crear un equipo
   */
  canCreateEquipo(): boolean {
    return this.hasRole(['master', 'directivo_liga']);
  }

  /**
   * Verifica si puede editar un equipo
   */
  canEditEquipo(): boolean {
    return this.hasRole(['master', 'directivo_liga']);
  }

  /**
   * Verifica si puede eliminar un equipo
   */
  canDeleteEquipo(): boolean {
    return this.hasRole(['master', 'directivo_liga']);
  }

  /**
   * Verifica si puede crear un jugador
   */
  canCreateJugador(): boolean {
    return this.hasRole(['master', 'directivo_liga', 'dirigente_equipo']);
  }

  /**
   * Verifica si puede editar un jugador
   */
  canEditJugador(): boolean {
    return this.hasRole(['master', 'directivo_liga', 'dirigente_equipo']);
  }

  /**
   * Verifica si puede eliminar un jugador
   */
  canDeleteJugador(): boolean {
    return this.hasRole(['master', 'directivo_liga', 'dirigente_equipo']);
  }

  /**
   * Verifica si puede acceder al módulo de campeonatos
   */
  canAccessCampeonatos(): boolean {
    return this.hasRole(['master', 'directivo_liga', 'dirigente_equipo']);
  }

  /**
   * Verifica si puede crear un campeonato
   */
  canCreateCampeonato(): boolean {
    return this.hasRole(['master', 'directivo_liga']);
  }

  /**
   * Verifica si puede editar un campeonato
   */
  canEditCampeonato(): boolean {
    return this.hasRole(['master', 'directivo_liga']);
  }

  /**
   * Verifica si puede eliminar un campeonato
   */
  canDeleteCampeonato(): boolean {
    return this.hasRole(['master', 'directivo_liga']);
  }

  /**
   * Verifica si puede acceder al módulo de categorías
   */
  canAccessCategorias(): boolean {
    return this.hasRole(['master', 'directivo_liga', 'dirigente_equipo']);
  }

  /**
   * Verifica si puede crear una categoría
   */
  canCreateCategoria(): boolean {
    return this.hasRole(['master', 'directivo_liga']);
  }

  /**
   * Verifica si puede editar una categoría
   */
  canEditCategoria(): boolean {
    return this.hasRole(['master', 'directivo_liga']);
  }

  /**
   * Verifica si puede eliminar una categoría
   */
  canDeleteCategoria(): boolean {
    return this.hasRole(['master', 'directivo_liga']);
  }

  /**
   * Verifica si puede acceder al módulo de inscripciones
   */
  canAccessInscripciones(): boolean {
    return this.hasRole(['master', 'directivo_liga', 'dirigente_equipo']);
  }

  /**
   * Verifica si puede crear una inscripción
   */
  canCreateInscripcion(): boolean {
    return this.hasRole(['master', 'directivo_liga', 'dirigente_equipo']);
  }

  /**
   * Verifica si puede confirmar/rechazar una inscripción
   */
  canManageInscripcion(): boolean {
    return this.hasRole(['master', 'directivo_liga']);
  }

  /**
   * Verifica si puede eliminar una inscripción
   */
  canDeleteInscripcion(): boolean {
    return this.hasRole(['master', 'directivo_liga']);
  }

  // ==================== HABILITACIÓN DE JUGADORES ====================

  /**
   * Verifica si puede acceder al módulo de habilitación de jugadores
   */
  canAccessJugadorCampeonatos(): boolean {
    return this.hasRole(['master', 'directivo_liga', 'dirigente_equipo']);
  }

  /**
   * Verifica si puede solicitar habilitación de jugadores
   */
  canInscribirJugador(): boolean {
    return this.hasRole(['master', 'directivo_liga', 'dirigente_equipo']);
  }

  /**
   * Verifica si puede editar habilitación de jugadores
   */
  canEditJugadorCampeonato(): boolean {
    return this.hasRole(['master', 'directivo_liga', 'dirigente_equipo']);
  }

  /**
   * Verifica si puede aprobar/rechazar habilitaciones
   */
  canAprobarHabilitaciones(): boolean {
    return this.hasRole(['master', 'directivo_liga']);
  }

  /**
   * Verifica si puede eliminar habilitación de jugadores
   */
  canDeleteJugadorCampeonato(): boolean {
    return this.hasRole(['master', 'directivo_liga']);
  }

  // ==================== TRANSFERENCIAS ====================

  /**
   * Verifica si puede acceder al módulo de transferencias
   */
  canAccessTransferencias(): boolean {
    return this.hasRole(['master', 'directivo_liga', 'dirigente_equipo']);
  }

  /**
   * Verifica si puede solicitar transferencias
   */
  canSolicitarTransferencia(): boolean {
    return this.hasRole(['master', 'dirigente_equipo']);
  }

  /**
   * Verifica si puede aprobar transferencias como equipo origen
   */
  canAprobarTransferenciaEquipoOrigen(): boolean {
    return this.hasRole(['master', 'dirigente_equipo']);
  }

  /**
   * Verifica si puede aprobar transferencias como directivo
   */
  canAprobarTransferenciaDirectivo(): boolean {
    return this.hasRole(['master', 'directivo_liga']);
  }

  /**
   * Verifica si puede cancelar transferencias
   */
  canCancelarTransferencia(): boolean {
    return this.hasRole(['master', 'dirigente_equipo']);
  }
}

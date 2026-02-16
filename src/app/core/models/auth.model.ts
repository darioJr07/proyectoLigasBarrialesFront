/**
 * Modelo de Usuario
 */
export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: Role;
  ligaId?: number;
  equipoId?: number;
  activo: boolean;
  creadoEn: Date;
}

/**
 * Modelo de Rol
 */
export interface Role {
  id: number;
  nombre: string;
  descripcion?: string;
}

/**
 * Respuesta de autenticación
 */
export interface AuthResponse {
  user: User;
  token: string;
}

/**
 * DTO para login
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * DTO para registro
 */
export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
  rolId: number;
  ligaId?: number;
  equipoId?: number;
}

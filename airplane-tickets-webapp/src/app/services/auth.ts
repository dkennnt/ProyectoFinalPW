import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { User } from './user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private currentUser: User | null = null;

  constructor(private router: Router) {
    // Si hay datos en localStorage, los cargamos al iniciar
    const stored = localStorage.getItem('icarusUser');
    if (stored) {
      this.currentUser = JSON.parse(stored);
    }
  }

  /** Guarda los datos del usuario al iniciar sesión */
  login(user: User) {
    this.currentUser = user;
    localStorage.setItem('icarusUser', JSON.stringify(user));
  }

  /** Retorna el usuario actual */
  getUser(): User | null {
    return this.currentUser;
  }

  /** Retorna true si hay usuario logueado */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /** Cierra sesión y limpia todo */
  logout() {
    this.currentUser = null;
    localStorage.removeItem('icarusUser');
    this.router.navigate(['/login']);
  }

  /** Verifica si el usuario actual es VIP */
  isVIP(): boolean {
    return !!this.currentUser?.isvip;
  }

  /** Retorna el ID del usuario actual (para reservas) */
  getUserId(): number | null {
    return this.currentUser?.userid ?? null;
  }
}

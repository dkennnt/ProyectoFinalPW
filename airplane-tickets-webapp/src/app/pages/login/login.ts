import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  email = '';
  password = '';
  loading = false;
  errorMsg = '';

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin(): void {
    this.errorMsg = '';

    if (!this.email || !this.password) {
      this.errorMsg = 'Por favor ingresa tu correo y contraseña.';
      return;
    }

    this.loading = true;

    this.userService.login(this.email, this.password).subscribe({
      next: (res) => {
        console.log('Login exitoso:', res);

        // Algunos backends devuelven el user dentro de "user"
        const user = res.user ?? res;

        if (!user) {
          this.errorMsg = 'Respuesta inválida del servidor.';
          console.warn('Respuesta inesperada:', res);
          return;
        }

        // Guardamos la sesión usando el AuthService
        this.authService.login(res.user);

        // Si el usuario es VIP, mostramos el aviso
        if (user.isvip) {
          alert('🎉 Bienvenido VIP! Obtendrás 10% de descuento en tus próximas reservas.');
        }

        // Redirigir al flujo de asientos
        this.router.navigate(['/seat-selection']);
      },
      error: (err) => {
        console.error('❌ Error en login:', err);
        this.errorMsg = err.error?.error || 'Credenciales incorrectas.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}

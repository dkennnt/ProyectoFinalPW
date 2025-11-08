import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  nombre = '';
  apellido = '';
  email = '';
  password = '';
  confirmPassword = '';
  loading = false;
  errorMsg = '';

  constructor(private userService: UserService, private router: Router) {}

  onRegister(): void {
    this.errorMsg = '';

    if (!this.nombre || !this.apellido || !this.email || !this.password || !this.confirmPassword) {
      this.errorMsg = 'Por favor completa todos los campos.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMsg = 'Las contraseñas no coinciden.';
      return;
    }

    if (!this.email.endsWith('@gmail.com') && !this.email.endsWith('@outlook.com')) {
      this.errorMsg = 'Solo se permiten correos @gmail.com o @outlook.com.';
      return;
    }

    const name = `${this.nombre} ${this.apellido}`.trim();
    const user = { name, email: this.email, password: this.password };

    this.loading = true;

    this.userService.register(user).subscribe({
      next: (res) => {
        console.log('✅ Registro exitoso:', res);
        alert('Cuenta creada exitosamente. ¡Bienvenido!');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('❌ Error en registro:', err);
        this.errorMsg = err.error?.error || 'Error al crear la cuenta.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}

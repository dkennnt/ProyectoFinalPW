import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../../services/reservation';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-reservation-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reservation-form.html',
  styleUrls: ['./reservation-form.css']
})
export class ReservationForm implements OnInit {
  selectedSeat: any;
  pasajero = {
    cui: '',
    nombre: '',
    apellido: '',
    equipaje: 0
  };

  constructor(
    private reservationService: ReservationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Traemos el asiento seleccionado del servicio global
    this.selectedSeat = this.reservationService.selectedSeat;
    if (!this.selectedSeat) {
      alert('No hay asiento seleccionado.');
      this.router.navigate(['/seat-diagram']);
      return;
    }

    console.log('🪑 Asiento seleccionado:', this.selectedSeat);
    console.log('🎟️ Reservas pendientes:', this.reservationService.reservasPendientes);
  }

  validarCUI(cui: string): boolean {
    // Solo números y longitud correcta
    if (!/^\d{13}$/.test(cui)) return false;

    const depto = parseInt(cui.substring(9, 11), 10);   // dígitos 10-11
    const muni = parseInt(cui.substring(11, 13), 10);   // dígitos 12-13

    // Departamentos válidos: 01–22
    if (depto < 1 || depto > 22) return false;

    // Municipios válidos por departamento
    const municipiosPorDepto: { [key: number]: number } = {
      1: 17,  2: 8,  3: 16, 4: 16, 5: 13, 6: 14, 7: 19, 8: 21,
      9: 8, 10: 24, 11: 17, 12: 14, 13: 30, 14: 17, 15: 8, 16: 14,
      17: 5, 18: 11, 19: 30, 20: 17, 21: 8, 22: 11
    };

    if (muni < 1 || muni > (municipiosPorDepto[depto] || 0)) return false;

    return true;
  }

  confirmarReserva(): void {
    // Validar campos obligatorios
    if (!this.pasajero.cui || !this.pasajero.nombre || !this.pasajero.apellido) {
      alert('Por favor completa todos los campos del pasajero.');
      return;
    }

    if (!this.selectedSeat) {
      alert('No hay asiento seleccionado.');
      return;
    }

    if (!this.validarCUI(this.pasajero.cui)) {
      alert('El CUI ingresado no es válido.');
      return;
    }

    const currentUser = this.authService.getUser();

    if (!currentUser || !currentUser.userid) {
      alert('Tu sesión ha expirado. Inicia sesión nuevamente.');
      this.router.navigate(['/login']);
      return;
    }

    // Forzamos el tipo porque ya validamos arriba
    const reserva = {
      userid: currentUser.userid as number,
      passenger: {
        cui: this.pasajero.cui,
        firstname: this.pasajero.nombre,
        lastname: this.pasajero.apellido
      },
      seatid: this.selectedSeat.seatid,
      luggage: this.pasajero.equipaje
    };


    console.log('🟢 Enviando reserva:', reserva);

    // Llamar al servicio HTTP
    this.reservationService.addReservation(reserva).subscribe({
      next: (res) => {
        console.log('✅ Reserva creada:', res);

        if (res.isvip) {
          alert('🎉 ¡Felicidades! Ahora eres usuario VIP. Obtendrás 10% de descuento en tus próximas reservas.');
        }

        // Registrar la reserva en el flujo global
        this.reservationService.registrarReservaExitosa({
          reservationid: res.reservationid,
          seatnumber: this.selectedSeat.seatnumber,
          classtype: this.selectedSeat.classtype,
          price: this.selectedSeat.price || 0,
          passenger: this.pasajero
        });

        // Mostrar progreso
        console.log(
          `🧾 Reserva confirmada (#${res.reservationid}). Restantes: ${this.reservationService.reservasPendientes}`
        );

        // Redirigir al componente de confirmación
        this.router.navigate(['/confirmation']);
      },
      error: (err) => {
        console.error('❌ Error al guardar la reserva:', err);
        alert('Ocurrió un error al guardar la reserva. Ver consola para más detalles.');
      }
    });
  }
}

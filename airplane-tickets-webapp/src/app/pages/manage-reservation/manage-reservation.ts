import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ReservationService } from '../../services/reservation';

@Component({
  selector: 'app-manage-reservation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './manage-reservation.html',
  styleUrls: ['./manage-reservation.css']
})
export class ManageReservation {
  reservationId = '';
  cui = '';
  name = '';
  foundReservation: any = null;
  message = '';
  loading = false;

  constructor(private reservationService: ReservationService, private router: Router) {}

  searchReservation(): void {
    if (!this.reservationId || (!this.cui && !this.name)) {
      this.message = 'Por favor ingresa número de reserva y CUI o nombre.';
      return;
    }

    this.loading = true;
    this.reservationService.searchReservation({
      reservationid: Number(this.reservationId),
      cui: this.cui,
      name: this.name
    }).subscribe({
      next: (res) => {
        this.foundReservation = res;
        this.message = '';
        this.loading = false;
      },
      error: (err) => {
        this.message = err.error?.error || 'Reserva no encontrada.';
        this.loading = false;
      }
    });
  }

  goToChangeSeat(): void {
  const confirmar = confirm(
    '⚠️ La modificación de esta reserva tendrá un recargo del 10% sobre el precio inicial del boleto.\n\n¿Deseas continuar?'
  );
  if (!confirmar) return;
  // Si el usuario acepta, redirigimos al diagrama de asientos
  this.router.navigate(['/seat-diagram'], {
    queryParams: { editReservationId: this.foundReservation.reservationid }
  });
}


  cancelReservation(): void {
    if (!confirm('¿Seguro que deseas cancelar esta reserva?')) return;

    this.reservationService.cancelReservation(this.foundReservation.reservationid).subscribe({
      next: () => {
        alert('🗑️ Reserva cancelada correctamente.');
        this.foundReservation = null;
        this.message = 'Reserva cancelada.';
      },
      error: (err) => console.error('Error al cancelar reserva:', err)
    });
  }
}

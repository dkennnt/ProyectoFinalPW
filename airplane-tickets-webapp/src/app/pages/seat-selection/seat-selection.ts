import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../services/reservation';

@Component({
  selector: 'app-seat-selection',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.css'
})
export class SeatSelection {
  seatOptions = [
    { label: 'Business Class', key: 'business', count: 0 },
    { label: 'Economy Class', key: 'economy', count: 0 }
  ];

  constructor(private router: Router, private reservationSvc: ReservationService) {}

  get totalSeats() {
    return this.seatOptions.reduce((sum, o) => sum + o.count, 0);
  }

  increment(option: any) {
    if (option.count < 5) option.count++;
  }

  decrement(option: any) {
    if (option.count > 0) option.count--;
  }

  goToSeatDiagram() {
  // Calculamos cuántos boletos seleccionó en total
  const totalSeats = this.seatOptions.reduce((sum, o) => sum + o.count, 0);

  if (totalSeats <= 0) {
    alert('Selecciona al menos 1 boleto para continuar.');
    return;
  }

  // Guardamos también en el servicio global
  this.reservationSvc.iniciarBatch(totalSeats);

  // Mantén tu lógica de localStorage si la usas para persistencia visual
  localStorage.setItem('seatSelection', JSON.stringify(this.seatOptions));

  this.router.navigate(['/seat-diagram']);
  }
}

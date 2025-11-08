import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../services/reservation';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './confirmation.html'
})
export class Confirmation implements OnInit {
  resumen: any;
  pendientes: number = 0;

  constructor(
    private reservationSvc: ReservationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.resumen = this.reservationSvc.ultimaReserva;
    this.pendientes = this.reservationSvc.reservasPendientes;
  }

  continuar() {
    if (this.pendientes > 0) {
      this.router.navigate(['/seat-diagram']);
    } else {
      this.router.navigate(['/']); // nada pendiente, vuelve al home
    }
  }

  terminarAqui() {
    this.reservationSvc.resetAll();
    this.router.navigate(['/']);
  }
}

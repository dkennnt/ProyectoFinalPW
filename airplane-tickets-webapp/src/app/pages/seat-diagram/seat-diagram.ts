import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReservationService, Seat } from '../../services/reservation';

@Component({
  selector: 'app-seat-diagram',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './seat-diagram.html',
  styleUrls: ['./seat-diagram.css']
})
export class SeatDiagram implements OnInit {
  // Filas / columnas según el diagrama
  BUSINESS_ROWS = ['I', 'G', 'F', 'D', 'C', 'A'];
  BUSINESS_COLS = [1, 2];

  ECONOMY_ROWS = ['I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'];
  ECONOMY_LEFT = [3, 4];
  ECONOMY_RIGHT = [5, 6, 7];

  seats: Seat[] = [];
  private seatsMap = new Map<string, Seat>();
  selectedSeat?: Seat;
  editReservationId?: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservationSvc: ReservationService
  ) {}

  async ngOnInit() {
    // Verificar si hay parámetro editReservationId
    this.route.queryParams.subscribe(params => {
      const editId = params['editReservationId'];
      if (editId) {
        this.editReservationId = Number(editId);
        console.log('✈️ Modo edición: reserva #', this.editReservationId);

        // Validar estado de la reserva antes de continuar
        this.reservationSvc.searchReservation({
          reservationid: this.editReservationId,
          cui: '',
          name: ''
        }).subscribe({
          next: (res) => {
            if (res.status === 'cancelled') {
              alert('❌ Esta reserva ya fue cancelada y no puede modificarse.');
              this.router.navigate(['/']);
            } else {
              console.log('✅ Reserva válida para edición:', res);
            }
          },
          error: (err) => {
            console.error('❌ Error al verificar reserva:', err);
            alert('No se pudo verificar la reserva. Redirigiendo al inicio.');
            this.router.navigate(['/']);
          }
        });
      }
    });

    // Cargar asientos desde la API
    const res = await fetch('http://localhost:3000/seats');
    this.seats = await res.json();

    // Normalizar estados
    for (const s of this.seats) {
      const st = (s.status || '').toString().toLowerCase();
      if (st === 'reserved') s.status = 'occupied';
      if (st !== 'occupied' && st !== 'available') s.status = 'available';
      this.seatsMap.set(s.seatnumber, s);
    }
  }

  seatBy(row: string, col: number): Seat | undefined {
    return this.seatsMap.get(`${row}${col}`);
  }

  isAvailable(row: string, col: number): boolean {
    const s = this.seatBy(row, col);
    return !!s && s.status === 'available';
  }

  isOccupied(row: string, col: number): boolean {
    const s = this.seatBy(row, col);
    return !!s && s.status === 'occupied';
  }

  isSelected(row: string, col: number): boolean {
    const code = `${row}${col}`;
    return !!this.selectedSeat && this.selectedSeat.seatnumber === code;
  }

  toggleSeat(row: string, col: number): void {
    const seat = this.seatBy(row, col);
    if (!seat || seat.status !== 'available') return;

    if (this.selectedSeat && this.selectedSeat.seatid === seat.seatid) {
      this.selectedSeat = undefined;
    } else {
      this.selectedSeat = seat;
    }
  }

  continue(): void {
    if (!this.selectedSeat) {
      alert('Selecciona un asiento antes de continuar.');
      return;
    }

    // Si estamos editando una reserva
    if (this.editReservationId) {
      this.reservationSvc.changeSeat(Number(this.editReservationId), this.selectedSeat!.seatid).subscribe({
        next: () => {
          alert('✅ Asiento actualizado con fee del 10%.');
          this.router.navigate(['/manage-reservation']);
        },
        error: (err) => {
          console.error('❌ Error al cambiar asiento:', err);
          alert('Ocurrió un error al actualizar el asiento.');
        }
      });
      return;
    }

    // Si NO es modo edición → flujo normal
    this.reservationSvc.setSelectedSeat(this.selectedSeat);
    this.router.navigate(['/reservation-form']);
  }
}

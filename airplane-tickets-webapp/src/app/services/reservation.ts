import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ---------- Interfaces ----------
export interface Passenger {
  cui: string;
  firstname: string;
  lastname: string;
}

export interface Reservation {
  userid: number;
  passenger: Passenger;
  seatid: number;
  luggage: number;
}

export interface Seat {
  seatid: number;
  seatnumber: string;
  classtype: 'Business' | 'Economy';
  price?: number;
  status?: 'available' | 'occupied';
}

// ---------- Servicio ----------
@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private apiUrl = 'http://localhost:3000/reservations';

  // Estado global del flujo
  private cantidadSolicitada = 0;
  private pendientes = 0;
  private _selectedSeat: Seat | null = null;
  private _ultimaReserva: any = null;

  constructor(private http: HttpClient) {}

  // Métodos HTTP
  addReservation(reservation: Reservation): Observable<any> {
    return this.http.post<any>(this.apiUrl, reservation);
  }

  // Control de batch
  iniciarBatch(cantidad: number) {
    this.cantidadSolicitada = cantidad;
    this.pendientes = cantidad;
    this._selectedSeat = null;
    this._ultimaReserva = null;
  }

  get reservasPendientes() {
    return this.pendientes;
  }

  get totalSolicitado() {
    return this.cantidadSolicitada;
  }

  get selectedSeat() {
    return this._selectedSeat;
  }

  setSelectedSeat(seat: Seat | null) {
    this._selectedSeat = seat;
  }

  // Al confirmar una reserva
  registrarReservaExitosa(data: any) {
    this.pendientes = Math.max(0, this.pendientes - 1);
    this._ultimaReserva = { ...data, restantes: this.pendientes };
    this._selectedSeat = null;
  }

  get ultimaReserva() {
    return this._ultimaReserva;
  }

  getReservationsByUser(userid: number): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/user/${userid}`);
  }

  changeSeat(reservationId: number, newSeatId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${reservationId}/change-seat`, { newSeatId });
  }

  cancelReservation(reservationId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${reservationId}`);
  }

  searchReservation(data: { reservationid: number; cui?: string; name?: string }): Observable<any> {
  return this.http.post(`${this.apiUrl}/search`, data);
  }

  resetAll() {
    this.cantidadSolicitada = 0;
    this.pendientes = 0;
    this._selectedSeat = null;
    this._ultimaReserva = null;
  }
}

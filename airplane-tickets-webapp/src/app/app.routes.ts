import { Routes } from '@angular/router';
import { LandingPage } from './pages/landing-page/landing-page';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { SeatSelection } from './pages/seat-selection/seat-selection';
import { SeatDiagram } from './pages/seat-diagram/seat-diagram';
import { ReservationForm } from './pages/reservation-form/reservation-form';
import { Confirmation } from './pages/confirmation/confirmation';
import { ManageReservation } from './pages/manage-reservation/manage-reservation';
import { AuthGuard } from './guards/auth-guard';
import { Reports } from './pages/reports/reports';

export const routes: Routes = [
  { path: '', component: LandingPage },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'seat-selection', component: SeatSelection, canActivate: [AuthGuard] },
  { path: 'seat-diagram', component: SeatDiagram, canActivate: [AuthGuard] },
  { path: 'reservation-form', component: ReservationForm, canActivate: [AuthGuard] },
  { path: 'confirmation', component: Confirmation, canActivate: [AuthGuard] },
  { path: 'manage-reservation', component: ManageReservation, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' },
  { path: 'reports', component: Reports }

];

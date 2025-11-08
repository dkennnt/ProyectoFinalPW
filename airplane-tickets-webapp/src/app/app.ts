import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  username: string | null = null;
  isvip = false;

  constructor(
    private router: Router,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadSession();
  }

  loadSession(): void {
    this.username = sessionStorage.getItem('username');
    this.isvip = sessionStorage.getItem('isvip') === 'true';
  }

  logout(): void {
    sessionStorage.clear();
    this.username = null;
    this.isvip = false;
    this.router.navigate(['/login']);
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class Reports {
  uploadStats: any = null;
  summary: any = null;
  message = '';

  constructor(private http: HttpClient) {}

  /** ===== EXPORTAR XML ===== */
  downloadXML() {
    window.open('http://localhost:3000/reservations/export-xml', '_blank');
  }

  /** ===== IMPORTAR XML ===== */
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    this.http.post('http://localhost:3000/reservations/import-xml', formData)
      .subscribe({
        next: (res: any) => {
          this.uploadStats = res.importStats;
          this.message = '✅ Archivo importado correctamente.';
        },
        error: (err) => {
          console.error(err);
          this.message = '❌ Error al importar el archivo.';
        }
      });
  }

  /** ===== CARGAR REPORTES SQL ===== */
  loadSummary() {
    this.http.get('http://localhost:3000/reports/summary')
      .subscribe({
        next: (data: any) => {
          this.summary = data;
          this.message = '';
        },
        error: (err) => {
          console.error(err);
          this.message = '❌ No se pudieron cargar los reportes.';
        }
      });
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  email = '';
  submitted = false;
  loading = false;
  errorMessage = '';

  constructor(private http: HttpClient) {}

  onSubmit(): void {
    if (!this.email) return;
    this.loading = true;
    this.errorMessage = '';

    this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email: this.email })
      .subscribe({
        next: () => {
          this.submitted = true;
          this.loading = false;
        },
        error: () => {
          // Mesmo em erro exibimos confirmação para não revelar se email existe
          this.submitted = true;
          this.loading = false;
        }
      });
  }
}

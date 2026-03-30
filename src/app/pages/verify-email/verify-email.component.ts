import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css'
})
export class VerifyEmailComponent implements OnInit {
  state: 'loading' | 'success' | 'error' | 'no-token' = 'loading';
  errorMessage = '';
  resendEmail = '';
  resendState: 'idle' | 'loading' | 'sent' | 'error' = 'idle';
  resendError = '';

  constructor(private route: ActivatedRoute, private authService: AuthService) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.state = 'no-token';
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: () => { this.state = 'success'; },
      error: (err) => {
        this.state = 'error';
        this.errorMessage = err?.error?.mensagem || 'Não foi possível verificar o e-mail.';
      }
    });
  }

  onResend(): void {
    if (!this.resendEmail) return;
    this.resendState = 'loading';
    this.resendError = '';

    this.authService.resendVerification(this.resendEmail).subscribe({
      next: () => { this.resendState = 'sent'; },
      error: (err) => {
        this.resendState = 'error';
        this.resendError = err?.error?.mensagem || 'Erro ao reenviar o e-mail.';
      }
    });
  }
}

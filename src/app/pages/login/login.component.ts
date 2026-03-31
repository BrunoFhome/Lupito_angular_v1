import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent {
    email = '';
    password = '';
    errorMessage = '';
    emailNotVerified = false;
    resendState: 'idle' | 'loading' | 'sent' | 'error' = 'idle';
    resendError = '';
    showPassword = false;

    constructor(private authService: AuthService, private router: Router) { }

    onLogin(): void {
        this.errorMessage = '';
        this.emailNotVerified = false;
        if (!this.email || !this.password) {
            this.errorMessage = 'Preencha todos os campos.';
            return;
        }

        this.authService.login(this.email, this.password).subscribe({
            next: () => {
                this.router.navigate(['/dashboard']);
            },
            error: (err) => {
                if (err.status === 403) {
                    this.emailNotVerified = true;
                } else {
                    this.errorMessage = err?.error?.mensagem || 'E-mail ou senha incorretos.';
                }
            }
        });
    }

    onResendVerification(): void {
        this.resendState = 'loading';
        this.resendError = '';
        this.authService.resendVerification(this.email).subscribe({
            next: () => { this.resendState = 'sent'; },
            error: (err) => {
                this.resendState = 'error';
                this.resendError = err?.error?.mensagem || 'Erro ao reenviar o e-mail.';
            }
        });
    }
}

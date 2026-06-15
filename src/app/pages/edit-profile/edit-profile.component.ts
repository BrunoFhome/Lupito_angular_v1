import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { LoadingBannerComponent } from '../../components/loading-banner/loading-banner.component';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoadingBannerComponent],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.css'
})
export class EditProfileComponent implements OnInit {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';

  loading = true;
  saving = false;

  nameError = '';
  emailError = '';
  passwordError = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.name = user.name;
        this.email = user.email;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  private validate(): boolean {
    this.nameError = '';
    this.emailError = '';
    this.passwordError = '';
    let valid = true;

    if (!this.name.trim()) {
      this.nameError = 'Informe seu nome.';
      valid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.email.trim()) {
      this.emailError = 'Informe seu e-mail.';
      valid = false;
    } else if (!emailRegex.test(this.email.trim())) {
      this.emailError = 'E-mail inválido.';
      valid = false;
    }

    if (this.password || this.confirmPassword) {
      if (this.password.length < 6) {
        this.passwordError = 'A senha deve ter pelo menos 6 caracteres.';
        valid = false;
      } else if (this.password !== this.confirmPassword) {
        this.passwordError = 'As senhas não coincidem.';
        valid = false;
      }
    }

    return valid;
  }

  save(): void {
    if (!this.validate() || this.saving) {
      return;
    }

    this.saving = true;
    const payload: { name: string; email: string; password?: string } = {
      name: this.name.trim(),
      email: this.email.trim()
    };
    if (this.password) {
      payload.password = this.password;
    }

    this.authService.updateAccount(payload).subscribe({
      next: () => {
        this.saving = false;
        this.password = '';
        this.confirmPassword = '';
        this.toast.success('Perfil atualizado!');
        this.router.navigate(['/preferences']);
      },
      error: () => {
        this.saving = false;
        this.toast.error('Não foi possível salvar as alterações.');
      }
    });
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { WalkingLupitoLoaderComponent } from '../../components/walking-lupito-loader/walking-lupito-loader.component';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, WalkingLupitoLoaderComponent],
    templateUrl: './register.component.html',
    styleUrl: './register.component.css'
})
export class RegisterComponent {
    name = '';
    email = '';
    password = '';
    confirmPassword = '';
    city = '';
    state = '';
    errorMessage = '';
    registrationSuccess = false;
    showPassword = false;
    showConfirmPassword = false;
    loading = false;

    get strengthScore(): number {
        const p = this.password;
        if (!p) return 0;
        let s = 0;
        if (p.length >= 6)          s++;
        if (p.length >= 10)         s++;
        if (/[A-Z]/.test(p))        s++;
        if (/[a-z]/.test(p))        s++;
        if (/[0-9]/.test(p))        s++;
        if (/[^A-Za-z0-9]/.test(p)) s++;
        return s;
    }

    get strengthFilled(): number {
        const s = this.strengthScore;
        if (s <= 0) return 0;
        if (s <= 2) return 1;
        if (s === 3) return 2;
        if (s === 4) return 3;
        return 4;
    }

    get strengthLabel(): string {
        const s = this.strengthScore;
        if (s <= 1) return 'Muito fraca';
        if (s === 2) return 'Fraca';
        if (s <= 4) return 'Média';
        if (s === 5) return 'Forte';
        return 'Muito forte';
    }

    get strengthColor(): string {
        const s = this.strengthScore;
        if (s <= 1) return '#ef4444';
        if (s === 2) return '#f97316';
        if (s <= 4) return '#f59e0b';
        if (s === 5) return '#22c55e';
        return '#16a34a';
    }

    readonly brazilianStates = [
        { sigla: 'AC', nome: 'Acre' },
        { sigla: 'AL', nome: 'Alagoas' },
        { sigla: 'AP', nome: 'Amapá' },
        { sigla: 'AM', nome: 'Amazonas' },
        { sigla: 'BA', nome: 'Bahia' },
        { sigla: 'CE', nome: 'Ceará' },
        { sigla: 'DF', nome: 'Distrito Federal' },
        { sigla: 'ES', nome: 'Espírito Santo' },
        { sigla: 'GO', nome: 'Goiás' },
        { sigla: 'MA', nome: 'Maranhão' },
        { sigla: 'MT', nome: 'Mato Grosso' },
        { sigla: 'MS', nome: 'Mato Grosso do Sul' },
        { sigla: 'MG', nome: 'Minas Gerais' },
        { sigla: 'PA', nome: 'Pará' },
        { sigla: 'PB', nome: 'Paraíba' },
        { sigla: 'PR', nome: 'Paraná' },
        { sigla: 'PE', nome: 'Pernambuco' },
        { sigla: 'PI', nome: 'Piauí' },
        { sigla: 'RJ', nome: 'Rio de Janeiro' },
        { sigla: 'RN', nome: 'Rio Grande do Norte' },
        { sigla: 'RS', nome: 'Rio Grande do Sul' },
        { sigla: 'RO', nome: 'Rondônia' },
        { sigla: 'RR', nome: 'Roraima' },
        { sigla: 'SC', nome: 'Santa Catarina' },
        { sigla: 'SP', nome: 'São Paulo' },
        { sigla: 'SE', nome: 'Sergipe' },
        { sigla: 'TO', nome: 'Tocantins' },
    ];

    constructor(private authService: AuthService, private router: Router) { }

    onRegister(): void {
        this.errorMessage = '';

        if (!this.name || !this.email || !this.password || !this.confirmPassword) {
            this.errorMessage = 'Preencha todos os campos obrigatórios.';
            return;
        }

        if (this.password !== this.confirmPassword) {
            this.errorMessage = 'As senhas não coincidem.';
            return;
        }

        if (this.password.length < 6) {
            this.errorMessage = 'A senha deve ter no mínimo 6 caracteres.';
            return;
        }

        this.loading = true;
        this.authService.register(
            this.name, this.email, this.password,
            this.city || undefined,
            this.state || undefined
        ).subscribe({
            next: () => {
                this.loading = false;
                this.registrationSuccess = true;
            },
            error: (err) => {
                this.loading = false;
                this.errorMessage = err.message;
            }
        });
    }
}

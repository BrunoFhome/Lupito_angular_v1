import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
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

        this.authService.register(
            this.name, this.email, this.password,
            this.city || undefined,
            this.state || undefined
        ).subscribe({
            next: () => { this.registrationSuccess = true; },
            error: (err) => {
                this.errorMessage = err.message;
            }
        });
    }
}

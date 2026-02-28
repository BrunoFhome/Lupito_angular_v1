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

    constructor(private authService: AuthService, private router: Router) { }

    onLogin(): void {
        this.errorMessage = '';
        if (!this.email || !this.password) {
            this.errorMessage = 'Please fill in all fields.';
            return;
        }

        const success = this.authService.login(this.email, this.password);
        if (success) {
            this.router.navigate(['/profile']);
        } else {
            this.errorMessage = 'Invalid credentials. Please try again.';
        }
    }
}

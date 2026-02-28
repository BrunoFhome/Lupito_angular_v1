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
    errorMessage = '';

    constructor(private authService: AuthService, private router: Router) { }

    onRegister(): void {
        this.errorMessage = '';

        if (!this.name || !this.email || !this.password || !this.confirmPassword) {
            this.errorMessage = 'Please fill in all fields.';
            return;
        }

        if (this.password !== this.confirmPassword) {
            this.errorMessage = 'Passwords do not match.';
            return;
        }

        if (this.password.length < 6) {
            this.errorMessage = 'Password must be at least 6 characters.';
            return;
        }

        const success = this.authService.register(this.name, this.email, this.password);
        if (success) {
            this.router.navigate(['/profile']);
        } else {
            this.errorMessage = 'Registration failed. Please try again.';
        }
    }
}

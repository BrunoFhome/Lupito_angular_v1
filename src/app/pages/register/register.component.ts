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

        if (this.password.length < 3) {
            this.errorMessage = 'Password must be at least 3 characters.';
            return;
        }

        this.authService.register(this.name, this.email, this.password).subscribe({
            next: () => {
                // After successful registration, route them back to login
                this.router.navigate(['/login']);
            },
            error: (err) => {
                console.error(err);
                this.errorMessage = 'Registration failed. Email might already be taken.';
            }
        });
    }
}

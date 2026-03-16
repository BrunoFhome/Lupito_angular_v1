import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
    user: User | null = null;
    isEditingBio = false;
    errorMessage: string | null = null;

    constructor(private authService: AuthService, private router: Router) { }

    ngOnInit(): void {
        this.authService.getCurrentUser().subscribe({
            next: (data) => {
                this.user = data;
            },
            error: (err) => {
                this.errorMessage = err.message || JSON.stringify(err);
                console.error('Failed to load user profile.', err);
                
                // If it's a server error or unauthorized, force logout to clear bad state
                if (err.status === 401 || err.status === 403 || err.status === 404 || err.status === 500) {
                    // Timeout allows the user to see the error briefly
                    setTimeout(() => this.authService.logout(), 3000);
                }
            }
        });
    }

    toggleEditBio(): void {
        this.isEditingBio = !this.isEditingBio;
    }

    saveBio(): void {
        if (this.user) {
            this.authService.updateUserProfile(this.user).subscribe({
                next: (updatedUser) => {
                    this.user = updatedUser;
                    this.isEditingBio = false;
                },
                error: (err) => {
                    console.error('Failed to update bio.', err);
                }
            });
        }
    }

    onLogout(): void {
        this.authService.logout();
    }
}

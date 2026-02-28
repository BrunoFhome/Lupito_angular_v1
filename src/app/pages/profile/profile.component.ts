import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
    user!: User;

    constructor(private authService: AuthService, private router: Router) { }

    ngOnInit(): void {
        this.user = this.authService.getCurrentUser();
    }

    onLogout(): void {
        this.authService.logout();
    }
}

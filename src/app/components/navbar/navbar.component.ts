import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  streak = 1;

  private readonly DEFAULT_PHOTO = 'assets/images/lupito_pers/4.png';

  get profilePhoto(): string {
    return localStorage.getItem('userPhoto') || this.DEFAULT_PHOTO;
  }

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe(user => {
      if (user.currentStreak != null) {
        this.streak = user.currentStreak;
      }
    });
  }
}

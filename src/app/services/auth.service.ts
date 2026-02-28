import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role: string;
  joinDate: string;
  bio: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // Static mock user - replace with real API data later
  private mockUser: User = {
    id: 1,
    name: 'Luiz Pinto',
    email: 'luiz.pinto@email.com',
    username: 'lupito',
    role: 'Student',
    joinDate: '2024-01-15',
    bio: 'Computer Science student passionate about programming and learning new technologies.'
  };

  private loggedIn = false;

  constructor(private router: Router) {}

  login(email: string, password: string): boolean {
    // Mock validation - replace with real API call later
    if (email && password) {
      this.loggedIn = true;
      return true;
    }
    return false;
  }

  register(name: string, email: string, password: string): boolean {
    // Mock registration - replace with real API call later
    if (name && email && password) {
      this.loggedIn = true;
      return true;
    }
    return false;
  }

  logout(): void {
    this.loggedIn = false;
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.loggedIn;
  }

  getCurrentUser(): User {
    return this.mockUser;
  }
}

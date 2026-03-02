import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, BehaviorSubject } from 'rxjs';

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
  private apiUrl = 'http://localhost:8081/auth';
  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());

  // Static mock user - temporary fallback if not using Spring user fetching yet
  private mockUser: User = {
    id: 1,
    name: 'Luiz Pinto',
    email: 'luiz.pinto@email.com',
    username: 'lupito',
    role: 'Student',
    joinDate: '2024-01-15',
    bio: 'Computer Science student passionate about programming and learning new technologies.'
  };

  constructor(private http: HttpClient, private router: Router) {}

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        if (response.token) {
          localStorage.setItem('token', response.token);
          this.loggedIn.next(true);
        }
      })
    );
  }

  register(name: string, email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, { name, email, password });
  }

  logout(): void {
    localStorage.removeItem('token');
    this.loggedIn.next(false);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.hasToken();
  }

  isLoggedInObservable(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  getCurrentUser(): User {
    // You should later implement a real call to get user Profile from API
    return this.mockUser;
  }
}

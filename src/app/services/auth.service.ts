import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ActivityDay {
  date: string;   // "2026-03-31"
  count: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role: string;
  joinDate: string;
  bio: string;
  learningProgress?: number;
  currentStreak?: number;
  city?: string;
  state?: string;
  githubUrl?: string;
  linkedinUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());

  // dados estaticos para simular um usuário logado, caso o token não esteja presente ou seja inválido
  private mockUser: User = {
    id: 1,
    name: 'Bruno teste',
    email: 'bruno.teste@email.com',
    username: 'lupito',
    role: 'Estudante',
    joinDate: '2024-01-15',
    bio: 'Estudante.'
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

  register(name: string, email: string, password: string, city?: string, state?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, { name, email, password, city, state });
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

getCurrentUser(): Observable<User> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return new Observable<User>(observer => {
        observer.next(this.mockUser);
        observer.complete();
      });
    }
    return this.http.get<User>(`${environment.apiUrl}/users/${userId}`);
  }

  getActivityData(userId: number, days = 30): Observable<ActivityDay[]> {
    return this.http.get<ActivityDay[]>(`${environment.apiUrl}/users/${userId}/activity?days=${days}`);
  }

  updateUserProfile(user: User): Observable<User> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return new Observable<User>(observer => {
        this.mockUser = { ...this.mockUser, ...user };
        observer.next(this.mockUser);
        observer.complete();
      });
    }
    return this.http.put<User>(`${environment.apiUrl}/users/${userId}`, user);
  }

  verifyEmail(token: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/verify-email?token=${token}`);
  }

  resendVerification(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/resend-verification`, { email });
  }

  getCurrentUserId(): number | null {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        let payload = token.split('.')[1];
        payload = payload.replace(/-/g, '+').replace(/_/g, '/');
        const pad = payload.length % 4;
        if (pad) {
          if (pad === 1) {
            throw new Error('InvalidLengthError: Input base64url string is the wrong length to determine padding');
          }
          payload += new Array(5 - pad).join('=');
        }
        const decoded = JSON.parse(atob(payload));
        return decoded.userId || null;
      } catch (e) {
        console.error('Error decoding token', e);
        return null;
      }
    }
    const storedId = localStorage.getItem('userId');
    return storedId ? parseInt(storedId, 10) : null;
  }
}



import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  getCurrentUser(): Observable<User> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return new Observable<User>(observer => {
        observer.next(this.mockUser);
        observer.complete();
      });
    }
    return this.http.get<User>(`http://localhost:8081/users/${userId}`, this.getAuthHeaders());        
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
    return this.http.put<User>(`http://localhost:8081/users/${userId}`, user, this.getAuthHeaders());  
  }

  private getCurrentUserId(): number | null {
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

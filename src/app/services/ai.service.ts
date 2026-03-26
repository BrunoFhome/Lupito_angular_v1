import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AIService {
  constructor(private http: HttpClient) {}

  evaluate(code: string, language: string, challengeInstructions: string): Observable<{ feedback: string }> {
    const token = localStorage.getItem('token');
    return this.http.post<{ feedback: string }>(
      `${environment.apiUrl}/api/ai/evaluate`,
      { code, language, challengeInstructions },
      { headers: new HttpHeaders({ 'Authorization': 'Bearer ' + token }) }
    );
  }
}

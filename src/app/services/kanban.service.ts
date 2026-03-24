import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface KanbanTask {
  id: number;
  title: string;
  description: string;
  priority: string;
  assignee: string;
  status: 'todo' | 'in-progress' | 'in-review' | 'done';
  challengeInstructions?: string;
  starterCode?: string;
  userCode?: string;
  language?: string;
}

@Injectable({
  providedIn: 'root'
})
export class KanbanService {
  private apiUrl = `${environment.apiUrl}/api/kanban`;
  private tasksSubject = new BehaviorSubject<KanbanTask[]>([]);  

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Authorization': 'Bearer ' + token
      })
    };
  }

  private getJsonHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      })
    };
  }

  loadTasks(): void {
    this.http.get<KanbanTask[]>(this.apiUrl + '/tasks', this.getAuthHeaders())
      .subscribe(tasks => {
        this.tasksSubject.next(tasks || []);
      }, err => console.error(err));
  }

  getTasks(): Observable<KanbanTask[]> {
    return this.tasksSubject.asObservable();
  }

  saveCode(taskId: number, code: string): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/tasks/${taskId}/code`,
      JSON.stringify({ code }),
      this.getJsonHeaders()
    );
  }

  updateTaskStatus(taskId: any, newStatus: KanbanTask['status']) {
    const numericId = parseInt(taskId.toString(), 10);
    this.http.put<KanbanTask>(this.apiUrl + '/tasks/' + numericId + '/status?status=' + newStatus, {}, this.getAuthHeaders())
      .subscribe(updated => {
         const tasks = this.tasksSubject.value.map(task =>
            task.id === numericId ? updated : task
         );
         this.tasksSubject.next(tasks);
      }, err => console.error(err));
  }

  updateTaskPriority(taskId: number, priority: string): void {
    this.http.put<KanbanTask>(
      `${this.apiUrl}/tasks/${taskId}/priority?priority=${encodeURIComponent(priority)}`,
      {},
      this.getAuthHeaders()
    ).subscribe({
      next: updated => {
        const tasks = this.tasksSubject.value.map(t => t.id === taskId ? updated : t);
        this.tasksSubject.next(tasks);
      },
      error: err => console.error(err)
    });
  }
}

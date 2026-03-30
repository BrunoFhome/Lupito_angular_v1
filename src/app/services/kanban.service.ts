import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
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
  expectedOutput?: string;
}

@Injectable({
  providedIn: 'root'
})
export class KanbanService {
  private apiUrl = `${environment.apiUrl}/api/kanban`;
  private tasksSubject = new BehaviorSubject<KanbanTask[]>([]);  

  constructor(private http: HttpClient) { }

  loadTasks(): void {
    this.http.get<KanbanTask[]>(this.apiUrl + '/tasks')
      .subscribe({ next: tasks => this.tasksSubject.next(tasks || []) });
  }

  getTasks(): Observable<KanbanTask[]> {
    return this.tasksSubject.asObservable();
  }

  saveCode(taskId: number, code: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/tasks/${taskId}/code`, { code });
  }

  updateTaskStatus(taskId: any, newStatus: KanbanTask['status']): void {
    const numericId = parseInt(taskId.toString(), 10);
    this.http.put<KanbanTask>(`${this.apiUrl}/tasks/${numericId}/status?status=${newStatus}`, {})
      .subscribe(updated => {
        const tasks = this.tasksSubject.value.map(task =>
          task.id === numericId ? updated : task
        );
        this.tasksSubject.next(tasks);
      });
  }

  updateTaskPriority(taskId: number, priority: string): void {
    this.http.put<KanbanTask>(
      `${this.apiUrl}/tasks/${taskId}/priority?priority=${encodeURIComponent(priority)}`,
      {}
    ).subscribe({
      next: updated => {
        const tasks = this.tasksSubject.value.map(t => t.id === taskId ? updated : t);
        this.tasksSubject.next(tasks);
      }
    });
  }
}

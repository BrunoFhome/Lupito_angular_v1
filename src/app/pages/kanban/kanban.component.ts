import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { KanbanService, KanbanTask } from '../../services/kanban.service';

export interface Column {
  id: string;
  mappedStatus: 'todo' | 'in-progress' | 'in-review' | 'done';
  title: string;
  colorClass: string;
}

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kanban.component.html',
  styleUrl: './kanban.component.css'
})
export class KanbanComponent implements OnInit {
  tasks: KanbanTask[] = [];

  columns: Column[] = [
    { id: 'todo', mappedStatus: 'todo', title: 'A Fazer', colorClass: 'col-todo' },
    { id: 'in-progress', mappedStatus: 'in-progress', title: 'Em Desenvolvimento', colorClass: 'col-in-progress' },
    { id: 'in-review', mappedStatus: 'in-review', title: 'Em Análise', colorClass: 'col-review' },
    { id: 'done', mappedStatus: 'done', title: 'Concluído', colorClass: 'col-done' }
  ];

  constructor(
    private kanbanService: KanbanService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.kanbanService.getTasks().subscribe(tasks => {
      this.tasks = tasks;
    });
  }

  getTasksForColumn(status: string): KanbanTask[] {
    return this.tasks.filter(task => task.status === status);
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'Alta': return 'priority-high';
      case 'Média': return 'priority-medium';
      case 'Baixa': return 'priority-low';
      default: return '';
    }
  }

  moveToDevelopment(taskId: string) {
    this.kanbanService.updateTaskStatus(taskId, 'in-progress');
  }

  openWorkspace(taskId: string) {
    this.router.navigate(['/workspace', taskId]);
  }
}

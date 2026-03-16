import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { KanbanService, KanbanTask } from '../../services/kanban.service';

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [CommonModule, MatIconModule, NavbarComponent],
  templateUrl: './kanban.component.html',
  styleUrls: ['./kanban.component.css']
})
export class KanbanComponent implements OnInit {
  tasks: KanbanTask[] = [];

  constructor(private router: Router, private kanbanService: KanbanService) {}

  ngOnInit() {
    this.kanbanService.getTasks().subscribe(tasks => {
       this.tasks = tasks;
    });
    this.kanbanService.loadTasks();
  }

  getTasksByStatus(status: KanbanTask['status']) {
    return this.tasks.filter(task => task.status === status);
  }

  updateTaskStatus(taskId: number, newStatus: KanbanTask['status']) {
    this.kanbanService.updateTaskStatus(taskId, newStatus);
  }

  openWorkspace(taskId: number) {
    this.router.navigate(['/workspace', taskId]);
  }
}

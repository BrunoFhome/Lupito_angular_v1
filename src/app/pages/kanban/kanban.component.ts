import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { KanbanService, KanbanTask } from '../../services/kanban.service';

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, NavbarComponent],
  templateUrl: './kanban.component.html',
  styleUrls: ['./kanban.component.css']
})
export class KanbanComponent implements OnInit {
  tasks: KanbanTask[] = [];

  // Auto avaliação modal
  showEvaluation: boolean = false;
  evaluationTask: KanbanTask | null = null;
  evalChecks: boolean[] = [false, false, false, false];

  // Confirmação de movimentação
  showMoveConfirm: boolean = false;
  moveConfirmTask: KanbanTask | null = null;
  moveConfirmStatus: KanbanTask['status'] | null = null;
  moveConfirmLabel: string = '';

  private readonly statusLabels: Record<KanbanTask['status'], string> = {
    'todo': 'A Fazer',
    'in-progress': 'Em Andamento',
    'in-review': 'Em Revisão',
    'done': 'Concluído'
  };

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

  requestMoveTask(taskId: number, newStatus: KanbanTask['status']) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;
    this.moveConfirmTask = task;
    this.moveConfirmStatus = newStatus;
    this.moveConfirmLabel = this.statusLabels[newStatus];
    this.showMoveConfirm = true;
  }

  confirmMove() {
    if (this.moveConfirmTask && this.moveConfirmStatus) {
      this.updateTaskStatus(this.moveConfirmTask.id, this.moveConfirmStatus);
    }
    this.cancelMove();
  }

  cancelMove() {
    this.showMoveConfirm = false;
    this.moveConfirmTask = null;
    this.moveConfirmStatus = null;
    this.moveConfirmLabel = '';
  }

  openWorkspace(taskId: number) {
    this.router.navigate(['/workspace', taskId]);
  }

  openEvaluation(task: KanbanTask) {
    this.evaluationTask = task;
    this.evalChecks = [false, false, false, false];
    this.showEvaluation = true;
  }

  closeEvaluation() {
    this.showEvaluation = false;
    this.evaluationTask = null;
  }

  allChecked(): boolean {
    return this.evalChecks.every(c => c === true);
  }

  confirmEvaluation() {
    if (this.evaluationTask && this.allChecked()) {
      this.updateTaskStatus(this.evaluationTask.id, 'done');
      this.closeEvaluation();
    }
  }
}

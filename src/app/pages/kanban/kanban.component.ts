import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { KanbanService, KanbanTask } from '../../services/kanban.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, NavbarComponent],
  templateUrl: './kanban.component.html',
  styleUrls: ['./kanban.component.css']
})
export class KanbanComponent implements OnInit, OnDestroy {
  tasks: KanbanTask[] = [];
  loading = true;
  studentName = 'Aluno';

  // Auto avaliação modal
  showEvaluation: boolean = false;
  evaluationTask: KanbanTask | null = null;
  evalChecks: boolean[] = [false, false, false, false];

  // Edição de prioridade
  priorityEditTaskId: number | null = null;
  readonly priorityOptions = ['Alta', 'Média', 'Baixa'];

  // Confirmação de movimentação
  showMoveConfirm: boolean = false;
  moveConfirmTask: KanbanTask | null = null;
  moveConfirmStatus: KanbanTask['status'] | null = null;
  moveConfirmLabel: string = '';

  private destroy$ = new Subject<void>();

  private readonly statusLabels: Record<KanbanTask['status'], string> = {
    'todo': 'Missões',
    'in-progress': 'Em progresso',
    'in-review': 'Revisão',
    'done': 'Conquistas'
  };

  constructor(private router: Router, private kanbanService: KanbanService, private toast: ToastService, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.studentName = user.name?.split(' ')[0] || 'Aluno';
      });

    this.kanbanService.getTasks()
      .pipe(takeUntil(this.destroy$))
      .subscribe(tasks => {
        this.tasks = tasks;
        this.loading = false;
      });
    this.kanbanService.loadTasks();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
      this.toast.info(`Tarefa movida para "${this.moveConfirmLabel}"`);
    }
    this.cancelMove();
  }

  cancelMove() {
    this.showMoveConfirm = false;
    this.moveConfirmTask = null;
    this.moveConfirmStatus = null;
    this.moveConfirmLabel = '';
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.priorityEditTaskId = null;
  }

  openPriorityEdit(taskId: number, event: Event): void {
    event.stopPropagation();
    this.priorityEditTaskId = this.priorityEditTaskId === taskId ? null : taskId;
  }

  setPriority(taskId: number, priority: string, event: Event): void {
    event.stopPropagation();
    this.kanbanService.updateTaskPriority(taskId, priority);
    this.priorityEditTaskId = null;
  }

  goToTrilhas(): void {
    this.router.navigate(['/aprendizado']);
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
      this.toast.success('Tarefa concluída!');
      this.closeEvaluation();
    }
  }
}

import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, filter, take, takeUntil } from 'rxjs/operators';
import { KanbanService, KanbanTask } from '../../services/kanban.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.css']
})
export class WorkspaceComponent implements OnInit, OnDestroy {
  task: KanbanTask | null = null;
  taskId: number | null = null;
  isCompleted: boolean = false;

  language: string = 'python';
  code: string = '';

  output: string = '';
  outputType: 'text' | 'html' | 'error' | '' = '';
  isRunning: boolean = false;

  saveStatus: 'idle' | 'saving' | 'saved' | 'error' = 'idle';
  lastSavedAt: Date | null = null;

  private codeChange$ = new Subject<string>();
  private destroy$ = new Subject<void>();
  private codeInitialized = false;

  get htmlPreview(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.code);
  }

  private get localStorageKey(): string {
    return `workspace_code_${this.taskId}`;
  }

  // Avisa o browser antes de fechar/recarregar com save pendente
  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.saveStatus === 'saving') {
      event.preventDefault();
    }
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private kanbanService: KanbanService,
    private location: Location,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    // Salva no servidor após 1.5s sem digitação
    this.codeChange$.pipe(
      debounceTime(1500),
      takeUntil(this.destroy$)
    ).subscribe(code => this.persistCodeToServer(code));

    this.route.paramMap.subscribe(params => {
      const idParam = params.get('taskId');
      if (!idParam) return;

      this.taskId = parseInt(idParam, 10);

      // Carga inicial: inicializa o código UMA vez quando as tarefas chegam
      this.kanbanService.getTasks().pipe(
        filter(tasks => tasks.length > 0),
        take(1)
      ).subscribe(tasks => {
        const found = tasks.find(t => t.id === this.taskId);
        if (found) this.initializeTask(found);
      });

      // Mantém metadados (status, etc.) em sincronia SEM re-setar o código
      this.kanbanService.getTasks().pipe(
        takeUntil(this.destroy$)
      ).subscribe(tasks => {
        const found = tasks.find(t => t.id === this.taskId);
        if (found && this.codeInitialized) {
          this.task = found;
          this.isCompleted = found.status === 'done';
        }
      });

      this.kanbanService.loadTasks();
    });
  }

  private initializeTask(task: KanbanTask): void {
    this.task = task;
    this.isCompleted = task.status === 'done';
    this.language = this.detectLanguage(task.starterCode || '');

    // Prioridade: servidor > localStorage > starterCode > padrão
    const serverCode = task.userCode?.trim() ? task.userCode : null;
    const localBackup = this.loadFromLocalStorage();

    if (serverCode) {
      this.code = serverCode;
      // Sincroniza localStorage com o que veio do servidor
      this.saveToLocalStorage(serverCode);
    } else if (localBackup) {
      // Usuário tinha código local mas o servidor não tem — envia ao servidor
      this.code = localBackup;
      this.persistCodeToServer(localBackup);
    } else {
      this.code = task.starterCode ?? this.defaultCode();
    }

    this.codeInitialized = true;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCodeChange(newCode: string) {
    this.code = newCode;
    this.saveStatus = 'saving';
    // Salva no localStorage imediatamente (sem debounce) — proteção instantânea
    this.saveToLocalStorage(newCode);
    // Agenda save no servidor com debounce
    this.codeChange$.next(newCode);
  }

  private persistCodeToServer(code: string) {
    if (!this.taskId) return;
    this.kanbanService.saveCode(this.taskId, code).subscribe({
      next: () => {
        this.saveStatus = 'saved';
        this.lastSavedAt = new Date();
      },
      error: (err) => {
        this.saveStatus = 'error';
        console.error('Erro ao salvar código:', err);
      }
    });
  }

  private saveToLocalStorage(code: string): void {
    try {
      localStorage.setItem(this.localStorageKey, code);
    } catch {
      // Quota excedida — ignora silenciosamente
    }
  }

  private loadFromLocalStorage(): string | null {
    try {
      return localStorage.getItem(this.localStorageKey);
    } catch {
      return null;
    }
  }

  private defaultCode(): string {
    return this.language === 'html'
      ? '<!DOCTYPE html>\n<html>\n<body>\n\n</body>\n</html>\n'
      : '# Escreva seu código aqui.\n';
  }

  private detectLanguage(code: string): string {
    const trimmed = code.trimStart();
    return (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) ? 'html' : 'python';
  }

  onTabKey(event: Event) {
    event.preventDefault();
    const textarea = event.target as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    this.code = this.code.substring(0, start) + '    ' + this.code.substring(end);
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 4;
    });
  }

  runCode() {
    this.output = '';
    this.outputType = '';

    if (this.language === 'html') {
      this.outputType = 'html';
      this.output = this.code;
      return;
    }

    this.isRunning = true;
    const Sk = (window as any).Sk;
    let outputBuffer = '';

    Sk.configure({
      output: (text: string) => { outputBuffer += text; },
      read: (x: string) => {
        if (Sk.builtinFiles?.files?.[x] === undefined) {
          throw "File not found: '" + x + "'";
        }
        return Sk.builtinFiles.files[x];
      }
    });

    Sk.misceval.asyncToPromise(() =>
      Sk.importMainWithBody('<stdin>', false, this.code, true)
    ).then(() => {
      this.output = outputBuffer || '(sem saída)';
      this.outputType = 'text';
      this.isRunning = false;
    }).catch((err: any) => {
      this.output = err.toString();
      this.outputType = 'error';
      this.isRunning = false;
    });
  }

  clearOutput() {
    this.output = '';
    this.outputType = '';
  }

  completeTask() {
    if (this.taskId) {
      this.kanbanService.updateTaskStatus(this.taskId, 'done');
      this.isCompleted = true;
    }
  }

  goBack() {
    this.location.back();
  }
}

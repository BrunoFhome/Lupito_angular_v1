import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
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

  private codeChange$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  get htmlPreview(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.code);
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private kanbanService: KanbanService,
    private location: Location,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    // Auto-save: waits 1.5s after user stops typing
    this.codeChange$.pipe(
      debounceTime(1500),
      takeUntil(this.destroy$)
    ).subscribe(code => this.persistCode(code));

    this.route.paramMap.subscribe(params => {
      const idParam = params.get('taskId');
      if (idParam) {
        this.taskId = parseInt(idParam, 10);
        this.kanbanService.getTasks().subscribe(tasks => {
          const found = tasks.find(t => t.id === this.taskId);
          if (found) {
            this.task = found;
            this.isCompleted = found.status === 'done';
            this.language = this.detectLanguage(found.starterCode || '');
            // Load user's saved code if it exists, otherwise show starter code
            this.code = found.userCode ?? found.starterCode ?? this.defaultCode();
          }
        });
        this.kanbanService.loadTasks();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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

  onCodeChange(newCode: string) {
    this.code = newCode;
    this.saveStatus = 'saving';
    this.codeChange$.next(newCode);
  }

  private persistCode(code: string) {
    if (!this.taskId) return;
    this.kanbanService.saveCode(this.taskId, code).subscribe({
      next: () => this.saveStatus = 'saved',
      error: (err) => {
        this.saveStatus = 'error';
        console.error('Erro ao salvar código:', err.status, err.message, err.error);
      }
    });
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

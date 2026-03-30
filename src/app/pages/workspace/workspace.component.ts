import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, filter, take, takeUntil } from 'rxjs/operators';
import { KanbanService, KanbanTask } from '../../services/kanban.service';
import { AIService } from '../../services/ai.service';
import { AuthService } from '../../services/auth.service';
import { DomSanitizer } from '@angular/platform-browser';
import { ToastService } from '../../services/toast.service';

import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view';
import { EditorState, Extension } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark';
import { indentOnInput, bracketMatching, foldGutter } from '@codemirror/language';

type TaskMode = 'javascript' | 'web';
type WebFile  = 'html' | 'css' | 'js';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.css']
})
export class WorkspaceComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('editorContainer') editorContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('previewFrame')    previewFrame!: ElementRef<HTMLIFrameElement>;
  @ViewChild('sandboxFrame')    sandboxFrame!: ElementRef<HTMLIFrameElement>;

  task: KanbanTask | null = null;
  taskId: number | null = null;
  isCompleted = false;

  // ── Modo da tarefa ──────────────────────────────────────────────────────
  mode: TaskMode = 'javascript';

  // Modo JavaScript: código único
  code = '';

  // Modo Web: três arquivos independentes
  webFiles: { html: string; css: string; js: string } = { html: '', css: '', js: '' };
  activeFile: WebFile = 'html';
  readonly webFileList: WebFile[] = ['html', 'css', 'js'];

  // ── Output ──────────────────────────────────────────────────────────────
  output = '';
  outputType: 'text' | 'html' | 'error' | '' = '';
  isRunning = false;

  // ── Save status ─────────────────────────────────────────────────────────
  saveStatus: 'idle' | 'saving' | 'saved' | 'error' = 'idle';
  lastSavedAt: Date | null = null;

  // ── IA e Verificação ─────────────────────────────────────────────────────
  aiPanelOpen  = false;
  aiLoading    = false;
  aiFeedback   = '';
  aiUseCount   = 0;
  codeChangedSinceLastEval = true;
  verifyResult: 'correct' | 'incorrect' | null = null;

  private editorView: EditorView | null = null;
  private codeChange$ = new Subject<string>();
  private destroy$ = new Subject<void>();
  private codeInitialized = false;

  get currentCode(): string {
    return this.editorView ? this.editorView.state.doc.toString() : this.code;
  }

  private get localStorageKey(): string {
    const uid = this.authService.getCurrentUserId() ?? 'guest';
    return `workspace_code_${uid}_${this.taskId}`;
  }

  private get aiCountKey(): string {
    const uid = this.authService.getCurrentUserId() ?? 'guest';
    return `ai_count_${uid}_${this.taskId}`;
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.saveStatus === 'saving') event.preventDefault();
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private kanbanService: KanbanService,
    private aiService: AIService,
    private authService: AuthService,
    private location: Location,
    private sanitizer: DomSanitizer,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.codeChange$.pipe(
      debounceTime(1500),
      takeUntil(this.destroy$)
    ).subscribe(serialized => this.persistCodeToServer(serialized));

    this.route.paramMap.subscribe(params => {
      const idParam = params.get('taskId');
      if (!idParam) return;

      this.taskId = parseInt(idParam, 10);

      this.kanbanService.getTasks().pipe(
        filter(tasks => tasks.length > 0),
        take(1)
      ).subscribe(tasks => {
        const found = tasks.find(t => t.id === this.taskId);
        if (found) this.initializeTask(found);
      });

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

  ngAfterViewInit() {
    const initial = this.mode === 'web' ? this.webFiles[this.activeFile] : this.code;
    this.createEditor(initial);
  }

  // ── Editor ───────────────────────────────────────────────────────────────

  private getLangExtension(): Extension {
    if (this.mode === 'javascript') return javascript();
    switch (this.activeFile) {
      case 'html': return html();
      case 'css':  return css();
      case 'js':   return javascript();
    }
  }

  private createEditor(initialCode: string) {
    this.editorView?.destroy();

    const updateListener = EditorView.updateListener.of(update => {
      if (update.docChanged) {
        const value = update.state.doc.toString();
        if (this.mode === 'web') {
          this.webFiles[this.activeFile] = value;
        } else {
          this.code = value;
        }
        this.saveStatus = 'saving';
        const serialized = this.getSerializedCode();
        this.saveToLocalStorage(serialized);
        this.codeChange$.next(serialized);
        this.codeChangedSinceLastEval = true;
      }
    });

    const state = EditorState.create({
      doc: initialCode,
      extensions: [
        oneDark,
        lineNumbers(),
        highlightActiveLine(),
        drawSelection(),
        history(),
        indentOnInput(),
        bracketMatching(),
        foldGutter(),
        this.getLangExtension(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.theme({
          '&':            { height: '100%', fontSize: '14px' },
          '.cm-scroller': { overflow: 'auto', fontFamily: "'JetBrains Mono', monospace" },
          '.cm-content':  { padding: '8px 0' },
        }),
        updateListener,
      ],
    });

    this.editorView = new EditorView({
      state,
      parent: this.editorContainer.nativeElement,
    });
  }

  // ── Inicialização da tarefa ──────────────────────────────────────────────

  private initializeTask(task: KanbanTask): void {
    this.task = task;
    this.isCompleted = task.status === 'done';
    this.mode = task.language === 'web' ? 'web' : 'javascript';

    const localBackup = this.loadFromLocalStorage();

    if (this.mode === 'web') {
      const serverWeb = this.parseWebCode(task.userCode);
      const localWeb  = localBackup ? this.parseWebCode(localBackup) : null;
      const defaultWeb = this.defaultWebCode(task.starterCode);

      if (serverWeb) {
        this.webFiles = serverWeb;
        this.saveToLocalStorage(JSON.stringify(this.webFiles));
      } else if (localWeb) {
        this.webFiles = localWeb;
        this.persistCodeToServer(JSON.stringify(this.webFiles));
      } else {
        this.webFiles = defaultWeb;
      }
      this.activeFile = 'html';
    } else {
      const serverCode = task.userCode?.trim() ? task.userCode : null;
      if (serverCode) {
        this.code = serverCode;
        this.saveToLocalStorage(serverCode);
      } else if (localBackup) {
        this.code = localBackup;
        this.persistCodeToServer(localBackup);
      } else {
        this.code = task.starterCode ?? this.defaultJsCode();
      }
    }

    if (this.editorView) {
      const initial = this.mode === 'web' ? this.webFiles[this.activeFile] : this.code;
      this.createEditor(initial);
    }

    // Restaura contador de usos da IA para esta tarefa (máx. 3)
    const savedCount = localStorage.getItem(this.aiCountKey);
    this.aiUseCount = savedCount ? (parseInt(savedCount, 10) || 0) : 0;
    this.codeChangedSinceLastEval = this.aiUseCount === 0;
    this.aiFeedback = '';

    this.codeInitialized = true;
  }

  private parseWebCode(raw: string | undefined | null): { html: string; css: string; js: string } | null {
    if (!raw?.trim()) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.html !== undefined || parsed.css !== undefined || parsed.js !== undefined)) {
        return { html: parsed.html || '', css: parsed.css || '', js: parsed.js || '' };
      }
    } catch {}
    return null;
  }

  private defaultWebCode(starterCode?: string | null): { html: string; css: string; js: string } {
    return this.parseWebCode(starterCode) ?? {
      html: '<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n  <meta charset="UTF-8">\n  <title>Minha Página</title>\n</head>\n<body>\n\n</body>\n</html>\n',
      css:  '/* Escreva seu CSS aqui */\nbody {\n  font-family: sans-serif;\n  padding: 24px;\n}\n',
      js:   '// Escreva seu JavaScript aqui\nconsole.log(\'Página carregada!\');\n',
    };
  }

  // ── Troca de arquivo (modo web) ─────────────────────────────────────────

  switchFile(file: WebFile) {
    if (file === this.activeFile) return;
    if (this.editorView) {
      this.webFiles[this.activeFile] = this.editorView.state.doc.toString();
    }
    this.activeFile = file;
    this.createEditor(this.webFiles[this.activeFile]);
  }

  ngOnDestroy() {
    this.editorView?.destroy();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Executar / Visualizar ───────────────────────────────────────────────

  runCode(afterRun?: () => void): void {
    this.output = '';
    this.outputType = '';

    // Garante que o conteúdo atual do editor está salvo no estado
    if (this.editorView) {
      if (this.mode === 'web') {
        this.webFiles[this.activeFile] = this.editorView.state.doc.toString();
      } else {
        this.code = this.editorView.state.doc.toString();
      }
    }

    if (this.mode === 'web') {
      this.outputType = 'html';
      this.output = ' '; // valor truthy para exibir o painel
      this.cdr.detectChanges();
      this.writeToPreview(this.buildWebPreview());
      afterRun?.();
      return;
    }

    // Modo JavaScript: executa em iframe sandbox isolado
    this.isRunning = true;
    this.runInSandbox(this.code, afterRun);
  }

  private runInSandbox(code: string, afterRun?: () => void): void {
    const execId = Date.now().toString();
    const outputLines: string[] = [];

    // O código do usuário começa na linha 9 do srcdoc (após 8 linhas de setup).
    // window.onerror recebe a linha absoluta do srcdoc; subtraímos 8 para obter a linha do usuário.
    const USER_CODE_LINE_OFFSET = 8;

    const sandboxDoc = [
      '<!DOCTYPE html><html><body><script>',
      `var __id="${execId}";`,
      `console.log=function(){var a=[].slice.call(arguments);parent.postMessage({id:__id,t:'log',text:a.map(function(x){return typeof x==='object'?JSON.stringify(x,null,2):String(x)}).join(' ')},'*');};`,
      `console.error=function(){var a=[].slice.call(arguments);parent.postMessage({id:__id,t:'log',text:'[Erro] '+a.map(String).join(' ')},'*');};`,
      `console.warn=function(){var a=[].slice.call(arguments);parent.postMessage({id:__id,t:'log',text:'[Aviso] '+a.map(String).join(' ')},'*');};`,
      `window.onerror=function(msg,src,line,col,err){parent.postMessage({id:__id,t:'err',name:(err&&err.name)||'Erro',msg:(err&&err.message)||String(msg),line:line-${USER_CODE_LINE_OFFSET},col:col},'*');return true;};`,
      'try{',
      '(function(){',
      code,
      '})();',
      `parent.postMessage({id:__id,t:'done'},'*');`,
      `}catch(e){parent.postMessage({id:__id,t:'err',name:e.name||'Erro',msg:e.message||String(e),line:null,col:null},'*');}`,
      '<\/script></body></html>',
    ].join('\n');

    const finish = (fn: () => void) => {
      clearTimeout(timeoutId);
      window.removeEventListener('message', handler);
      fn();
      afterRun?.();
      this.cdr.detectChanges();
    };

    const timeoutId = setTimeout(() => {
      if (this.sandboxFrame?.nativeElement) {
        this.sandboxFrame.nativeElement.srcdoc = '';
      }
      finish(() => {
        this.output = 'Tempo limite excedido (5s). Verifique se há loops infinitos no código.';
        this.outputType = 'error';
        this.isRunning = false;
      });
    }, 5000);

    const handler = (event: MessageEvent) => {
      if (!event.data || event.data.id !== execId) return;
      const { t, text, name, msg, line, col } = event.data;

      if (t === 'log') {
        outputLines.push(text);
      } else if (t === 'err') {
        finish(() => {
          this.output = this.formatSandboxError(name, msg, line, col);
          this.outputType = 'error';
          this.isRunning = false;
        });
      } else if (t === 'done') {
        finish(() => {
          this.output = outputLines.join('\n') || '(sem saída)';
          this.outputType = 'text';
          this.isRunning = false;
        });
      }
    };

    window.addEventListener('message', handler);
    this.sandboxFrame.nativeElement.srcdoc = sandboxDoc;
  }

  private formatSandboxError(name: string, msg: string, line: number | null, col: number | null): string {
    let result = `${name}: ${msg}`;
    if (line !== null && line > 0) {
      const codeLine = this.code.split('\n')[line - 1] ?? '';
      const pointer  = col ? ' '.repeat(Math.max(0, col - 1)) + '^' : '';
      result += `\n  → Linha ${line}, Coluna ${col ?? '?'}\n\n  ${codeLine}`;
      if (pointer) result += `\n  ${pointer}`;
    }
    return result;
  }

  private buildWebPreview(): string {
    let doc = this.webFiles.html.trim();
    if (!doc) doc = '<!DOCTYPE html><html><head></head><body></body></html>';

    const css = this.webFiles.css;
    const js  = this.webFiles.js;

    if (css.trim()) {
      if (doc.includes('</head>')) {
        doc = doc.replace('</head>', `<style>\n${css}\n</style>\n</head>`);
      } else {
        doc = `<style>\n${css}\n</style>\n` + doc;
      }
    }

    if (js.trim()) {
      if (doc.includes('</body>')) {
        doc = doc.replace('</body>', `<script>\n${js}\n<\/script>\n</body>`);
      } else {
        doc += `\n<script>\n${js}\n<\/script>`;
      }
    }

    return doc;
  }

  private writeToPreview(htmlContent: string): void {
    const iframe = this.previewFrame?.nativeElement;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(htmlContent);
    doc.close();
  }

  // ── Verificação de saída ─────────────────────────────────────────────────

  verifyOutput(): void {
    if (this.mode !== 'javascript' || !this.task?.expectedOutput) return;
    this.verifyResult = null;
    this.runCode(() => {
      if (this.outputType === 'error') {
        this.verifyResult = 'incorrect';
        return;
      }
      const expected = this.task!.expectedOutput!.trim();
      const actual   = this.output.trim();
      if (actual === expected) {
        this.verifyResult = 'correct';
      } else {
        this.verifyResult = 'incorrect';
        this.output     = `Esperado:\n  ${expected}\n\nObtido:\n  ${actual}`;
        this.outputType = 'error';
      }
    });
  }

  // ── Avaliação por IA ─────────────────────────────────────────────────────

  evaluateWithAI(): void {
    if (this.aiUseCount >= 3 || !this.codeChangedSinceLastEval) return;

    const code         = this.mode === 'javascript' ? this.code : this.webFiles.js;
    const instructions = this.task?.challengeInstructions ?? '';
    const language     = this.task?.language ?? 'javascript';
    this.aiPanelOpen = true;
    this.aiLoading   = true;
    this.aiFeedback  = '';
    this.aiService.evaluate(code, language, instructions).subscribe({
      next: res => {
        this.aiFeedback  = res.feedback;
        this.aiLoading   = false;
        this.aiUseCount++;
        this.codeChangedSinceLastEval = false;
        try { localStorage.setItem(this.aiCountKey, String(this.aiUseCount)); } catch {}
      },
      error: () => {
        this.aiFeedback = 'Erro ao conectar com a IA. Tente novamente.';
        this.aiLoading  = false;
      }
    });
  }

  clearOutput() {
    this.output      = '';
    this.outputType  = '';
    this.verifyResult = null;
    this.writeToPreview('');
  }

  completeTask() {
    if (this.taskId) {
      this.kanbanService.updateTaskStatus(this.taskId, 'done');
      this.isCompleted = true;
      this.toast.success('Tarefa marcada como concluída!');
    }
  }

  goBack() {
    this.location.back();
  }

  // ── Persistência ────────────────────────────────────────────────────────

  private getSerializedCode(): string {
    return this.mode === 'web' ? JSON.stringify(this.webFiles) : this.code;
  }

  private persistCodeToServer(serialized: string) {
    if (!this.taskId) return;
    this.kanbanService.saveCode(this.taskId, serialized).subscribe({
      next: () => {
        const wasError = this.saveStatus === 'error';
        this.saveStatus = 'saved';
        this.lastSavedAt = new Date();
        if (wasError) this.toast.success('Código salvo com sucesso!');
      },
      error: () => {
        this.saveStatus = 'error';
      }
    });
  }

  private saveToLocalStorage(data: string): void {
    try { localStorage.setItem(this.localStorageKey, data); } catch {}
  }

  private loadFromLocalStorage(): string | null {
    try { return localStorage.getItem(this.localStorageKey); } catch { return null; }
  }

  private defaultJsCode(): string {
    return '// Escreva seu código aqui.\nconsole.log(\'Olá, Mundo!\');\n';
  }
}

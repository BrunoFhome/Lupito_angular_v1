import { Component, OnInit, OnDestroy, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LearningService, SectionDetails, Exercise } from '../../services/learning.service';
import { AuthService, User } from '../../services/auth.service';
import { ConfettiService } from '../../services/confetti.service';
import { LoadingBannerComponent } from '../../components/loading-banner/loading-banner.component';

import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { lineNumbers } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark';

type Phase = 'theory' | 'exercise' | 'completion';
type MascotState = 'hidden' | 'entering' | 'visible' | 'leaving';

interface LessonResult {
  lessonTitle: string;
  question: string;
  gotItRight: boolean;
  correctAnswer: string;
}

@Component({
  selector: 'app-lesson',
  standalone: true,
  imports: [CommonModule, LoadingBannerComponent],
  templateUrl: './lesson.component.html',
  styleUrl: './lesson.component.css'
})
export class LessonComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('codeExampleContainer') codeExampleContainer?: ElementRef<HTMLDivElement>;

  sectionDetails: SectionDetails | null = null;

  selectedOptionIndex: number | null = null;
  isSubmitted: boolean = false;
  isCorrect: boolean = false;

  // Drag-fill state
  draggedToken: string = '';
  dragAnswer: string | null = null;
  isDragSubmitted: boolean = false;
  isDragCorrect: boolean = false;

  user: User | null = null;
  phase: Phase = 'theory';

  // Route params
  courseId: number | null = null;
  sectionOrder: number | null = null;
  lessonOrder: number | null = null;

  // Rastreamento de resultado do exercício
  firstAttemptWrong: boolean = false;
  moduleResults: LessonResult[] = [];

  // Mascote
  mascotImage: string = '';
  mascotState: MascotState = 'hidden';
  private mascotTimer: ReturnType<typeof setTimeout> | null = null;

  private editorView: EditorView | null = null;
  private editorInitialized: boolean = false;
  private destroy$ = new Subject<void>();

  get safeTheoryContent(): SafeHtml {
    const content = this.sectionDetails?.theoryContent || '';
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

  get currentExercise(): Exercise | null {
    return this.sectionDetails?.exercises[0] ?? null;
  }

  get codeBeforeBlank(): string {
    return this.currentExercise?.theory.split('___')[0] ?? '';
  }

  get codeAfterBlank(): string {
    return this.currentExercise?.theory.split('___')[1] ?? '';
  }

  get progressBarWidth(): number {
    switch (this.phase) {
      case 'theory':     return 0;
      case 'exercise':   return 50;
      case 'completion': return 100;
    }
  }

  get isLastLessonInModule(): boolean {
    return this.lessonOrder === 3;
  }

  get correctCount(): number {
    return this.moduleResults.filter(r => r.gotItRight).length;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private learningService: LearningService,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
    private confetti: ConfettiService
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(u => this.user = u);

    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const sectionId = params.get('id');
        if (sectionId) this.fetchLesson(sectionId);
      });

    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params.has('courseId')) this.courseId = +params.get('courseId')!;
        if (params.has('sectionOrder')) this.sectionOrder = +params.get('sectionOrder')!;
        if (params.has('lessonOrder')) this.lessonOrder = +params.get('lessonOrder')!;
      });
  }

  ngAfterViewChecked(): void {
    if (this.phase === 'theory' && !this.editorInitialized && this.codeExampleContainer?.nativeElement) {
      this.initCodeViewer();
    }
  }

  fetchLesson(sectionId: string): void {
    this.sectionDetails = null;
    this.phase = 'theory';
    this.editorInitialized = false;
    this.editorView?.destroy();
    this.editorView = null;
    this.resetExerciseState();

    this.learningService.getSectionDetails(sectionId).subscribe({
      next: (data) => {
        this.sectionDetails = data;
      },
      error: () => {
        this.router.navigate(['/aprendizado']);
      }
    });
  }

  goToExercise(): void {
    this.phase = 'exercise';
  }

  private initCodeViewer(): void {
    if (!this.codeExampleContainer?.nativeElement || !this.sectionDetails) return;

    this.editorView?.destroy();

    const lang = this.sectionDetails.codeLanguage === 'html' ? html()
               : this.sectionDetails.codeLanguage === 'css'  ? css()
               : javascript();

    const state = EditorState.create({
      doc: this.sectionDetails.codeExample || '',
      extensions: [
        oneDark,
        lineNumbers(),
        lang,
        EditorView.editable.of(false),
        EditorState.readOnly.of(true),
        EditorView.theme({
          '&':            { fontSize: '14px' },
          '.cm-scroller': { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" },
          '.cm-content':  { padding: '8px 0' },
        }),
      ],
    });

    this.editorView = new EditorView({
      state,
      parent: this.codeExampleContainer.nativeElement,
    });

    this.editorInitialized = true;
  }

  selectOption(index: number): void {
    if (this.isSubmitted) return;
    this.selectedOptionIndex = index;
  }

  submitAnswer(): void {
    if (this.selectedOptionIndex === null || !this.currentExercise || this.isSubmitted) return;

    this.isSubmitted = true;
    this.isCorrect = (this.selectedOptionIndex === this.currentExercise.correctAnswerIndex);

    if (!this.isCorrect) {
      this.firstAttemptWrong = true;
      this.showMascot('assets/images/duvida.png', 3000);
    }
  }

  completeSection(): void {
    this.phase = 'completion';
    this.showMascot('assets/images/comemorando.png', 4000);

    if (this.isLastLessonInModule) {
      this.confetti.launch();
    }

    if (this.courseId && this.sectionOrder && this.lessonOrder && this.sectionDetails && this.currentExercise) {
      const result: LessonResult = {
        lessonTitle: this.sectionDetails.title,
        question: this.currentExercise.theory,
        gotItRight: !this.firstAttemptWrong,
        correctAnswer: this.currentExercise.options[this.currentExercise.correctAnswerIndex]
      };
      const key = `lesson-result-${this.courseId}-${this.sectionOrder}-${this.lessonOrder}`;
      sessionStorage.setItem(key, JSON.stringify(result));

      if (this.isLastLessonInModule) {
        this.moduleResults = [1, 2, 3].map(order => {
          const stored = sessionStorage.getItem(`lesson-result-${this.courseId}-${this.sectionOrder}-${order}`);
          return stored ? JSON.parse(stored) as LessonResult : null;
        }).filter((r): r is LessonResult => r !== null);
      }
    }

    if (this.courseId && this.sectionOrder && this.lessonOrder) {
      this.learningService.completeLesson(this.courseId, this.sectionOrder, this.lessonOrder).subscribe({
        next: () => {
          if (this.user && this.sectionDetails) {
            const globalIndex = this.learningService.getLessonGlobalIndex(this.sectionDetails.id);
            if (globalIndex >= (this.user.learningProgress || 0)) {
              this.user.learningProgress = globalIndex;
              this.authService.updateUserProfile(this.user).subscribe();
            }
          }
        },
        error: () => {}
      });
    }
  }

  goToNextLesson(): void {
    if (!this.sectionDetails || !this.courseId || !this.sectionOrder || !this.lessonOrder) return;
    const nextLessonId = String(parseInt(this.sectionDetails.id, 10) + 1);
    this.router.navigate(['/lesson', nextLessonId], {
      queryParams: {
        courseId: this.courseId,
        sectionOrder: this.sectionOrder,
        lessonOrder: this.lessonOrder + 1
      }
    });
  }

  exitLesson(): void {
    this.router.navigate(['/aprendizado']);
  }

  onTokenDrop(token: string): void {
    if (this.isDragSubmitted) return;
    this.dragAnswer = token;
  }

  clearDragAnswer(): void {
    if (this.isDragSubmitted) return;
    this.dragAnswer = null;
  }

  submitDragAnswer(): void {
    if (!this.dragAnswer || !this.currentExercise || this.isDragSubmitted) return;
    const correctToken = this.currentExercise.options[this.currentExercise.correctAnswerIndex];
    this.isDragCorrect = this.dragAnswer === correctToken;
    this.isDragSubmitted = true;
    this.isSubmitted = true;
    this.isCorrect = this.isDragCorrect;
    if (!this.isDragCorrect) this.firstAttemptWrong = true;
  }

  retryDragAnswer(): void {
    this.dragAnswer = null;
    this.isDragSubmitted = false;
    this.isDragCorrect = false;
    this.isSubmitted = false;
    this.isCorrect = false;
  }

  private resetExerciseState(): void {
    this.selectedOptionIndex = null;
    this.isSubmitted = false;
    this.isCorrect = false;
    this.firstAttemptWrong = false;
    this.moduleResults = [];
    this.dragAnswer = null;
    this.isDragSubmitted = false;
    this.isDragCorrect = false;
    this.draggedToken = '';
  }

  showMascot(image: string, duration: number): void {
    if (this.mascotTimer) clearTimeout(this.mascotTimer);
    this.mascotImage = image;
    this.mascotState = 'entering';
    setTimeout(() => { this.mascotState = 'visible'; }, 50);
    this.mascotTimer = setTimeout(() => this.hideMascot(), duration);
  }

  hideMascot(): void {
    this.mascotState = 'leaving';
    setTimeout(() => { this.mascotState = 'hidden'; }, 500);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.editorView?.destroy();
    if (this.mascotTimer) clearTimeout(this.mascotTimer);
  }
}

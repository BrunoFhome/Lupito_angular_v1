import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LearningService, SectionDetails, Exercise } from '../../services/learning.service';
import { AuthService, User } from '../../services/auth.service';

interface ExerciseResult {
  correct: boolean;
  question: string;
  chosen: string;
  answer: string;
}

@Component({
  selector: 'app-lesson',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lesson.component.html',
  styleUrl: './lesson.component.css'
})
export class LessonComponent implements OnInit {
  sectionDetails: SectionDetails | null = null;
  currentExerciseIndex: number = 0;

  selectedOptionIndex: number | null = null;
  isSubmitted: boolean = false;
  isCorrect: boolean = false;

  user: User | null = null;

  // Phases: theory → exercises → summary
  showTheory: boolean = true;
  showSummary: boolean = false;

  // Route params
  courseId: number | null = null;
  sectionOrder: number | null = null;
  lessonOrder: number | null = null;

  // Tracking & Summary
  exerciseResults: (ExerciseResult | undefined)[] = [];

  get safeTheoryContent(): SafeHtml {
    const content = this.sectionDetails?.theoryContent || '';
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

  get correctCount(): number {
    return this.exerciseResults.filter(r => r?.correct).length;
  }

  get wrongAnswers(): ExerciseResult[] {
    return this.exerciseResults.filter((r): r is ExerciseResult => !!r && !r.correct);
  }

  get totalExercises(): number {
    return this.sectionDetails?.exercises.length ?? 0;
  }

  get scorePercent(): number {
    return this.totalExercises > 0 ? Math.round((this.correctCount / this.totalExercises) * 100) : 0;
  }

  get progressBarWidth(): number {
    if (this.showTheory) return 0;
    if (this.showSummary) return 100;
    return (this.currentExerciseIndex / (this.totalExercises || 1)) * 100;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private learningService: LearningService,
    private authService: AuthService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe(u => this.user = u);

    this.route.paramMap.subscribe(params => {
      const sectionId = params.get('id');
      if (sectionId) {
        this.fetchLesson(sectionId);
      }
    });

    this.route.queryParamMap.subscribe(params => {
      if (params.has('courseId')) this.courseId = +params.get('courseId')!;
      if (params.has('sectionOrder')) this.sectionOrder = +params.get('sectionOrder')!;
      if (params.has('lessonOrder')) this.lessonOrder = +params.get('lessonOrder')!;
    });
  }

  fetchLesson(sectionId: string): void {
    this.sectionDetails = null;
    this.currentExerciseIndex = 0;
    this.exerciseResults = [];
    this.showTheory = true;
    this.showSummary = false;
    this.resetExerciseState();

    this.learningService.getSectionDetails(sectionId).subscribe({
      next: (data) => {
        this.sectionDetails = data;
      },
      error: (err) => {
        console.error('Failed to load lesson', err);
        this.router.navigate(['/aprendizado']);
      }
    });
  }

  startExercises(): void {
    this.showTheory = false;
  }

  get currentExercise(): Exercise | null {
    if (this.sectionDetails && this.sectionDetails.exercises.length > this.currentExerciseIndex) {
      return this.sectionDetails.exercises[this.currentExerciseIndex];
    }
    return null;
  }

  selectOption(index: number): void {
    if (this.isSubmitted) return;
    this.selectedOptionIndex = index;
  }

  submitAnswer(): void {
    if (this.selectedOptionIndex === null || !this.currentExercise || this.isSubmitted) return;

    this.isSubmitted = true;
    this.isCorrect = (this.selectedOptionIndex === this.currentExercise.correctAnswerIndex);

    // Record first attempt only (retry doesn't overwrite)
    if (this.exerciseResults[this.currentExerciseIndex] === undefined) {
      this.exerciseResults[this.currentExerciseIndex] = {
        correct: this.isCorrect,
        question: this.currentExercise.theory,
        chosen: this.currentExercise.options[this.selectedOptionIndex],
        answer: this.currentExercise.options[this.currentExercise.correctAnswerIndex]
      };
    }
  }

  nextExercise(): void {
    if (this.sectionDetails && this.currentExerciseIndex < this.sectionDetails.exercises.length - 1) {
      this.currentExerciseIndex++;
      this.resetExerciseState();
    }
  }

  completeSection(): void {
    this.showSummary = true;

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
        error: (err) => console.error('Failed to complete lesson', err)
      });
    }
  }

  exitLesson(): void {
    this.router.navigate(['/aprendizado']);
  }

  private resetExerciseState(): void {
    this.selectedOptionIndex = null;
    this.isSubmitted = false;
    this.isCorrect = false;
  }
}

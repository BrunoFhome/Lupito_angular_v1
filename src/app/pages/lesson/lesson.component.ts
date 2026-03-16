import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Required for ngIf and ngFor ideally
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LearningService, SectionDetails, Exercise } from '../../services/learning.service';
import { AuthService, User } from '../../services/auth.service';

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
  
  // Track parameters
  courseId: number | null = null;
  sectionOrder: number | null = null;
  lessonOrder: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private learningService: LearningService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe(u => this.user = u);

    // Listen to route changes to get the dynamic id
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
    // Reset state before fetching
    this.sectionDetails = null;
    this.currentExerciseIndex = 0;
    this.resetExerciseState();

    this.learningService.getSectionDetails(sectionId).subscribe({
      next: (data) => {
        this.sectionDetails = data;
      },
      error: (err) => {
        console.error('Failed to load lesson', err);
        // Handle error, e.g. navigate back
        this.router.navigate(['/aprendizado']);
      }
    });
  }

  get currentExercise(): Exercise | null {
    if (this.sectionDetails && this.sectionDetails.exercises.length > this.currentExerciseIndex) {
      return this.sectionDetails.exercises[this.currentExerciseIndex];
    }
    return null;
  }

  selectOption(index: number): void {
    if (this.isSubmitted) return; // Prevent changing answer after submission
    this.selectedOptionIndex = index;
  }

  submitAnswer(): void {
    if (this.selectedOptionIndex === null || !this.currentExercise || this.isSubmitted) return;
    
    this.isSubmitted = true;
    this.isCorrect = (this.selectedOptionIndex === this.currentExercise.correctAnswerIndex);
  }

  nextExercise(): void {
    if (this.sectionDetails && this.currentExerciseIndex < this.sectionDetails.exercises.length - 1) {
      this.currentExerciseIndex++;
      this.resetExerciseState();
    }
  }

  completeSection(): void {
    // Automatically issue a new project to Kanban "A Fazer" after completing a section
    // Assuming backend takes care of unlocking via its endpoint, but the frontend currently manually pushes:
    if (this.sectionDetails) {
      this.kanbanService.addTask({
        title: `Projeto Recompensa: ${this.sectionDetails.title}`,
        description: 'Implementar na prática os conceitos aprendidos nesta lição.',
        priority: 'Média',
        assignee: 'Você (Aluno)',
        status: 'todo'
      });

      if (this.user && this.courseId && this.sectionOrder && this.lessonOrder) {
          // 1. Update course-specific progression (prevents track 2 from unlocking)
          this.learningService.completeLesson(this.user.id, this.courseId, this.sectionOrder, this.lessonOrder).subscribe({
             next: () => {
                 // 2. Also bump the global learningProgress for Kanban unlock compatibility
                 if (this.user) {
                     const globalIndex = this.learningService.getLessonGlobalIndex(this.sectionDetails!.id);
                     if (globalIndex >= (this.user.learningProgress || 0)) {
                         this.user.learningProgress = globalIndex;
                         this.authService.updateUserProfile(this.user).subscribe(() => {
                             this.router.navigate(['/aprendizado']);
                         });
                         return;
                     }
                 }
                 this.router.navigate(['/aprendizado']);
             },
             error: (err) => {
                 console.error('Failed to complete lesson', err);
                 this.router.navigate(['/aprendizado']);
             }
          });
          return;
      }
    }
    this.router.navigate(['/aprendizado']);
  }

  private resetExerciseState(): void {
    this.selectedOptionIndex = null;
    this.isSubmitted = false;
    this.isCorrect = false;
  }
}






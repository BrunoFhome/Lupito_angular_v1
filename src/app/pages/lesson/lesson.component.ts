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

  exitLesson(): void {
    this.router.navigate(['/aprendizado']);
  }

  completeSection(): void {
    if (this.sectionDetails && this.user) {
      const lessonIdNumber = parseInt(this.sectionDetails.id, 10);
      const token = localStorage.getItem('token');
      
      const updateProgressAndNavigate = () => {
         if (this.user) {
            const globalIndex = this.learningService.getLessonGlobalIndex(this.sectionDetails!.id);
            const currentProgress = this.user.learningProgress || 0;

            if (globalIndex >= currentProgress) {
                this.user.learningProgress = globalIndex;
                this.authService.updateUserProfile(this.user).subscribe({
                    next: () => {
                        this.router.navigate(['/aprendizado']);
                    },
                    error: (err) => {
                        console.error('Failed to update progress', err);
                        this.router.navigate(['/aprendizado']);
                    }
                });
                return;
            }
          }
          this.router.navigate(['/aprendizado']);
      };

      this.http.post('http://localhost:8081/api/kanban/tasks/unlock/' + lessonIdNumber, {}, {
        headers: { 'Authorization': 'Bearer ' + token }
      }).subscribe({
        next: () => {
           console.log('Task unlocked successfully.');
           updateProgressAndNavigate();
        },
        error: (err) => {
           console.error('Error unlocking task (or already unlocked). Proceeding...', err);
           updateProgressAndNavigate();
        }
      });
      return;
    }
    this.router.navigate(['/aprendizado']);
  }

  private resetExerciseState(): void {
    this.selectedOptionIndex = null;
    this.isSubmitted = false;
    this.isCorrect = false;
  }
}

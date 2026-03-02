import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Required for ngIf and ngFor ideally
import { ActivatedRoute, Router } from '@angular/router';
import { LearningService, SectionDetails, Exercise } from '../../services/learning.service';
import { KanbanService } from '../../services/kanban.service';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private learningService: LearningService,
    private kanbanService: KanbanService
  ) {}

  ngOnInit(): void {
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

  completeSection(): void {
    // Automatically issue a new project to Kanban "A Fazer" after completing a section
    if (this.sectionDetails) {
      this.kanbanService.addTask({
        title: `Projeto Recompensa: ${this.sectionDetails.title}`,
        description: 'Implementar na prática os conceitos aprendidos nesta lição.',
        priority: 'Média',
        assignee: 'Você (Aluno)',
        status: 'todo'
      });
    }
    
    // Navigate back to the learning path
    this.router.navigate(['/aprendizado']);
  }

  private resetExerciseState(): void {
    this.selectedOptionIndex = null;
    this.isSubmitted = false;
    this.isCorrect = false;
  }
}

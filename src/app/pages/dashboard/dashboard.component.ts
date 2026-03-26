import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService, User } from '../../services/auth.service';
import { LearningService, CourseDTO, SectionDTO, LessonDTO } from '../../services/learning.service';
import { KanbanService, KanbanTask } from '../../services/kanban.service';

interface CourseCard {
  id: number;
  title: string;
  description: string;
  completedLessons: number;
  totalLessons: number;
  percent: number;
  nextLessonId?: string;
  nextLessonTitle?: string;
  nextSectionOrder?: number;
  nextLessonOrder?: number;
}

interface KanbanStats {
  todo: number;
  inProgress: number;
  inReview: number;
  done: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  courseCards: CourseCard[] = [];
  kanbanStats: KanbanStats = { todo: 0, inProgress: 0, inReview: 0, done: 0 };
  loading = true;

  get totalCompletedLessons(): number {
    return this.courseCards.reduce((sum, c) => sum + c.completedLessons, 0);
  }

  get totalLessons(): number {
    return this.courseCards.reduce((sum, c) => sum + c.totalLessons, 0);
  }

  get firstName(): string {
    return this.user?.name?.split(' ')[0] ?? '';
  }

  get overallPercent(): number {
    return this.totalLessons > 0
      ? Math.round((this.totalCompletedLessons / this.totalLessons) * 100)
      : 0;
  }

  get suggestedLesson(): CourseCard | null {
    return this.courseCards.find(c => c.nextLessonId != null) ?? null;
  }

  constructor(
    private router: Router,
    private authService: AuthService,
    private learningService: LearningService,
    private kanbanService: KanbanService
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe(u => {
      this.user = u;
      this.loadDashboard();
    });

    this.kanbanService.getTasks().subscribe(tasks => {
      this.kanbanStats = {
        todo: tasks.filter(t => t.status === 'todo').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        inReview: tasks.filter(t => t.status === 'in-review').length,
        done: tasks.filter(t => t.status === 'done').length
      };
    });
    this.kanbanService.loadTasks();
  }

  private loadDashboard(): void {
    this.learningService.getCourses().pipe(
      switchMap(courses => {
        if (!courses || courses.length === 0) return of([]);
        courses.sort((a, b) => a.id - b.id);
        const cardObservables = courses.map((course, index) =>
          this.buildCourseCard(course, index === 0)
        );
        return forkJoin(cardObservables);
      }),
      catchError(() => of([]))
    ).subscribe(cards => {
      // Unlock first lesson of course N if course N-1 is fully completed
      for (let i = 1; i < cards.length; i++) {
        if (cards[i - 1].percent === 100 && !cards[i].nextLessonId) {
          // Mark first lesson of next course as suggested if we have the data
        }
      }
      this.courseCards = cards;
      this.loading = false;
    });
  }

  private buildCourseCard(course: CourseDTO, isFirstCourse: boolean) {
    return forkJoin({
      sections: this.learningService.getSectionsByCourse(course.id),
      progress: this.learningService.getUserProgress(course.id).pipe(
        catchError(() => of(null))
      )
    }).pipe(
      switchMap(({ sections, progress }) => {
        if (!sections || sections.length === 0) {
          return of({
            id: course.id, title: course.title, description: course.description,
            completedLessons: 0, totalLessons: 0, percent: 0
          } as CourseCard);
        }

        sections.sort((a, b) => a.listOrder - b.listOrder);
        const lessonObservables = sections.map(sec =>
          this.learningService.getLessonsBySection(sec.id).pipe(catchError(() => of([] as LessonDTO[])))
        );

        return forkJoin(lessonObservables).pipe(
          switchMap(nestedLessons => {
            const totalLessons = sections.length; // conta módulos (seções)
            let completedLessons = 0;
            let nextLessonId: string | undefined;
            let nextLessonTitle: string | undefined;
            let nextSectionOrder: number | undefined;
            let nextLessonOrder: number | undefined;

            nestedLessons.forEach((sectionLessons, idx) => {
              const section = sections[idx];
              sectionLessons.sort((a, b) => a.listOrder - b.listOrder);

              // Módulo concluído = seção inteira foi ultrapassada no progresso
              const moduleCompleted = progress
                ? section.listOrder < progress.currentSectionOrder
                : false;

              if (moduleCompleted) completedLessons++;

              // Encontra a próxima lição para navegação
              if (!nextLessonId) {
                sectionLessons.forEach(lesson => {
                  if (nextLessonId) return;

                  let isCompleted = false;
                  let isLocked = true;

                  if (progress) {
                    if (section.listOrder < progress.currentSectionOrder) {
                      isCompleted = true;
                    } else if (
                      section.listOrder === progress.currentSectionOrder &&
                      lesson.listOrder < progress.currentLessonOrder
                    ) {
                      isCompleted = true;
                    }

                    if (isCompleted) {
                      isLocked = false;
                    } else if (
                      section.listOrder === progress.currentSectionOrder &&
                      lesson.listOrder === progress.currentLessonOrder
                    ) {
                      isLocked = false;
                    }
                  } else if (isFirstCourse) {
                    if (section.listOrder === 1 && lesson.listOrder === 1) {
                      isLocked = false;
                    }
                  }

                  if (!isCompleted && !isLocked) {
                    nextLessonId = lesson.id.toString();
                    nextLessonTitle = lesson.title;
                    nextSectionOrder = section.listOrder;
                    nextLessonOrder = lesson.listOrder;
                  }
                });
              }
            });

            const percent = totalLessons > 0
              ? Math.round((completedLessons / totalLessons) * 100)
              : 0;

            return of({
              id: course.id,
              title: course.title,
              description: course.description,
              completedLessons,
              totalLessons,
              percent,
              nextLessonId,
              nextLessonTitle,
              nextSectionOrder,
              nextLessonOrder
            } as CourseCard);
          })
        );
      })
    );
  }

  goToLesson(card: CourseCard): void {
    if (card.nextLessonId) {
      this.router.navigate(['/lesson', card.nextLessonId], {
        queryParams: {
          courseId: card.id,
          sectionOrder: card.nextSectionOrder,
          lessonOrder: card.nextLessonOrder
        }
      });
    }
  }

  goToAprendizado(): void {
    this.router.navigate(['/aprendizado']);
  }

  goToKanban(): void {
    this.router.navigate(['/kanban']);
  }
}

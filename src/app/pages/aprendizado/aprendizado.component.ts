import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { LearningService, CourseDTO, SectionDTO, LessonDTO } from '../../services/learning.service';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';

interface Lesson {
  title: string;
  locked: boolean;
  completed: boolean;
  id?: string;
  courseId?: number;
  sectionOrder?: number;
  lessonOrder?: number;
  globalIndex?: number;
}

interface LearningPath {
  title: string;
  subtitle: string;
  progress: number;
  total: number;
  lessons: Lesson[];
}

@Component({
  selector: 'app-aprendizado',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './aprendizado.component.html',
  styleUrl: './aprendizado.component.css'
})
export class AprendizadoComponent implements OnInit {
  user: User | null = null;
  paths: LearningPath[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private learningService: LearningService
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe(u => {
      this.user = u;
      this.loadCourses();
    });
  }

  loadCourses(): void {
    this.learningService.getCourses().pipe(
      switchMap(courses => {
        if (!courses || courses.length === 0) return of([]);
        const courseObservables = courses.map(course => this.buildLearningPath(course));
        return forkJoin(courseObservables);
      }),
      catchError(err => {
        console.error('Error fetching courses', err);
        return of([]);
      })
    ).subscribe(paths => {
      this.paths = paths;
    });
  }

  buildLearningPath(course: CourseDTO): Observable<LearningPath> {
    return forkJoin({
       sections: this.learningService.getSectionsByCourse(course.id),
       progress: this.user ? this.learningService.getUserProgress(course.id, this.user.id).pipe(
          catchError(() => of(null)) // fallback safely if progress not found
       ) : of(null)
    }).pipe(
       switchMap(({ sections, progress }) => {
          if (!sections || sections.length === 0) {
             return of({
               title: course.title,
               subtitle: course.description,
               progress: 0,
               total: 0,
               lessons: []
             } as LearningPath);
          }
          
          sections.sort((a,b) => a.listOrder - b.listOrder);
          const lessonsObservables = sections.map(sec => this.learningService.getLessonsBySection(sec.id));
          return forkJoin(lessonsObservables).pipe(
             map(nestedLessons => {
                const allLessons: Lesson[] = [];
                let completedLessons = 0;

                nestedLessons.forEach((sectionLessons, index) => {
                   const section = sections[index];
                   sectionLessons.sort((a,b) => a.listOrder - b.listOrder);
                   
                   sectionLessons.forEach(lesson => {
                      let isCompleted = false;
                      let isLocked = true;

                      if (progress) {
                         // Lesson completed if section is older, or if same section but older lesson
                         if (section.listOrder < progress.currentSectionOrder) {
                             isCompleted = true;
                         } else if (section.listOrder === progress.currentSectionOrder && lesson.listOrder < progress.currentLessonOrder) {
                             isCompleted = true;
                         }

                         // Unlocked if it is completed or exactly the current one
                         if (isCompleted) {
                             isLocked = false;
                         } else if (section.listOrder === progress.currentSectionOrder && lesson.listOrder === progress.currentLessonOrder) {
                             isLocked = false;
                         }
                      } else {
                         // Default fallback: unlock the first lesson of the first section
                         if (section.listOrder === 1 && lesson.listOrder === 1) {
                             isLocked = false;
                         }
                      }

                      if (isCompleted) {
                         completedLessons++;
                      }

                      allLessons.push({
                         title: lesson.title,
                         locked: isLocked,
                         completed: isCompleted,
                         id: lesson.id.toString(),
                         courseId: course.id,
                         sectionOrder: section.listOrder,
                         lessonOrder: lesson.listOrder
                      });
                   });
                });

                return {
                   title: course.title,
                   subtitle: course.description,
                   progress: completedLessons,
                   total: allLessons.length,
                   lessons: allLessons
                } as LearningPath;
             })
          );
       })
    );
  }

  navigateToLesson(lesson: Lesson) {
    if (!lesson.locked && lesson.id) {
       this.router.navigate(['/lesson', lesson.id], { 
           queryParams: { 
               courseId: lesson.courseId, 
               sectionOrder: lesson.sectionOrder, 
               lessonOrder: lesson.lessonOrder 
           } 
       });
    }
  }
}

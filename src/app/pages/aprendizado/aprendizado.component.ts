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
      let userProgress = (u && u.learningProgress) ? u.learningProgress : 0;
      this.loadCourses(userProgress);
    });
  }

  loadCourses(learningProgress: number): void {
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
      this.applyProgress(learningProgress);
    });
  }

  buildLearningPath(course: CourseDTO): Observable<LearningPath> {
    return this.learningService.getSectionsByCourse(course.id).pipe(
      switchMap(sections => {
         if (!sections || sections.length === 0) {
            return of({
              title: course.title,
              subtitle: course.description,
              progress: 0,
              total: 0,
              lessons: []
            } as LearningPath);
         }

         const lessonsObservables = sections.map(sec => this.learningService.getLessonsBySection(sec.id));
         return forkJoin(lessonsObservables).pipe(
           map(nestedLessons => {
              const allLessons: Lesson[] = [];
              nestedLessons.forEach((secLessons, idx) => {
                 secLessons.forEach(l => {
                    allLessons.push({
                       title: l.title,
                       locked: true,
                       completed: false,
                       id: l.id.toString(),
                       globalIndex: l.listOrder 
                    });
                 });
              });
              
              return {
                title: course.title,
                subtitle: course.description,
                progress: 0,
                total: allLessons.length,
                lessons: allLessons
              } as LearningPath;
           })
         );
      })
    );
  }

  applyProgress(learningProgress: number): void {
    this.paths.forEach(path => {
      let completedLessons = 0;
      path.lessons.forEach(lesson => {
        if (lesson.globalIndex !== undefined) {
          lesson.locked = lesson.globalIndex > learningProgress + 1;
          lesson.completed = lesson.globalIndex <= learningProgress;

          if (lesson.completed) {
             completedLessons++;
          }
        }
      });
      path.progress = completedLessons;
    });
  }

  navigateToLesson(lesson: Lesson) {
    if (!lesson.locked && lesson.id) {
      this.router.navigate(['/lesson', lesson.id]);
    }
  }
}

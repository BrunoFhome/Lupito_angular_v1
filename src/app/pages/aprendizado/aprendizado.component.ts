import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { LearningService, CourseDTO, SectionDTO, LessonDTO } from '../../services/learning.service';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';

interface Lesson {
  title: string;
  locked: boolean;
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
  imports: [CommonModule],
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
              nestedLessons.forEach(sectionLessons => {
                 sectionLessons.forEach(lesson => {
                    allLessons.push({
                       title: lesson.title,
                       locked: true,
                       id: lesson.id.toString(),
                       globalIndex: this.learningService.getLessonGlobalIndex(lesson.id.toString())
                    });
                 });
              });
              
              // Sort lessons by ID just in case
              allLessons.sort((a,b) => (a.globalIndex || 0) - (b.globalIndex || 0));

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
          // Unlocked if learningProgress is >= to the globalIndex
          // e.g. progress = 1 means first lesson (globalIndex=1) is unlocked
          lesson.locked = lesson.globalIndex > learningProgress + 1; // + 1 because if user has 0 progress, index 1 should be unlocked
          
          if (lesson.globalIndex <= learningProgress) {
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

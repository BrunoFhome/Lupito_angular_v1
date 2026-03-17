import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { LearningService, CourseDTO } from '../../services/learning.service';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

// ── Domain models ──────────────────────────────────────────────────────────────

interface Lesson {
  title: string;
  locked: boolean;
  completed: boolean;
  id?: string;
  courseId?: number;
  sectionOrder?: number;
  lessonOrder?: number;
}

interface LearningPath {
  title: string;
  subtitle: string;
  progress: number;
  total: number;
  lessons: Lesson[];
}

// ── Map layout models ──────────────────────────────────────────────────────────

interface NodePos {
  x: number;
  y: number;
  lesson: Lesson;
}

interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cssClass: string;
}

export interface PathLayout {
  path: LearningPath;
  nodes: NodePos[];
  segments: Segment[];
  svgWidth: number;
  svgHeight: number;
}

// ── Layout constants ───────────────────────────────────────────────────────────

const NODES_PER_ROW = 4;
const SPACING_X     = 180;
const SPACING_Y     = 160;
const PAD_X         = 90;
const PAD_Y         = 90;

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-aprendizado',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aprendizado.component.html',
  styleUrl: './aprendizado.component.css'
})
export class AprendizadoComponent implements OnInit {
  user: User | null = null;
  layouts: PathLayout[] = [];

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
        courses.sort((a, b) => a.id - b.id);
        const obs = courses.map((course, i) => this.buildLearningPath(course, i === 0));
        return forkJoin(obs);
      }),
      catchError(err => {
        console.error('Error fetching courses', err);
        return of([]);
      })
    ).subscribe(paths => {
      // Unlock first lesson of course N when course N-1 is fully completed
      for (let i = 1; i < paths.length; i++) {
        const prev = paths[i - 1];
        if (prev.total > 0 && prev.progress === prev.total && paths[i].lessons.length > 0) {
          paths[i].lessons[0].locked = false;
        }
      }
      this.layouts = paths.map(p => this.buildLayout(p));
    });
  }

  // ── Layout computation ───────────────────────────────────────────────────────

  private buildLayout(path: LearningPath): PathLayout {
    // Snake/zigzag positions: row 0 L→R, row 1 R→L, row 2 L→R …
    const nodes: NodePos[] = path.lessons.map((lesson, i) => {
      const row      = Math.floor(i / NODES_PER_ROW);
      const col      = i % NODES_PER_ROW;
      const reversed = row % 2 === 1;
      const x = reversed
        ? PAD_X + (NODES_PER_ROW - 1 - col) * SPACING_X
        : PAD_X + col * SPACING_X;
      const y = PAD_Y + row * SPACING_Y;
      return { x, y, lesson };
    });

    // Connector segments between consecutive nodes
    const segments: Segment[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      const from = nodes[i];
      const to   = nodes[i + 1];
      let cssClass: string;
      if (from.lesson.completed && to.lesson.completed) {
        cssClass = 'seg-done';
      } else if (from.lesson.completed && !to.lesson.locked) {
        cssClass = 'seg-current';
      } else {
        cssClass = 'seg-locked';
      }
      segments.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y, cssClass });
    }

    const rows      = Math.ceil(path.lessons.length / NODES_PER_ROW);
    const svgWidth  = PAD_X * 2 + (NODES_PER_ROW - 1) * SPACING_X;
    const svgHeight = PAD_Y * 2 + Math.max(rows - 1, 0) * SPACING_Y;

    return { path, nodes, segments, svgWidth, svgHeight };
  }

  // ── Data loading (unchanged logic) ──────────────────────────────────────────

  private buildLearningPath(course: CourseDTO, isFirstCourse: boolean): Observable<LearningPath> {
    return forkJoin({
      sections: this.learningService.getSectionsByCourse(course.id),
      progress: this.learningService.getUserProgress(course.id).pipe(catchError(() => of(null)))
    }).pipe(
      switchMap(({ sections, progress }) => {
        if (!sections || sections.length === 0) {
          return of({ title: course.title, subtitle: course.description, progress: 0, total: 0, lessons: [] });
        }

        sections.sort((a, b) => a.listOrder - b.listOrder);
        const lessonsObs = sections.map(sec => this.learningService.getLessonsBySection(sec.id));

        return forkJoin(lessonsObs).pipe(
          map(nestedLessons => {
            const allLessons: Lesson[] = [];
            let completedCount = 0;

            nestedLessons.forEach((sectionLessons, idx) => {
              const section = sections[idx];
              sectionLessons.sort((a, b) => a.listOrder - b.listOrder);

              sectionLessons.forEach(lesson => {
                let isCompleted = false;
                let isLocked    = true;

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
                } else if (isFirstCourse && section.listOrder === 1 && lesson.listOrder === 1) {
                  isLocked = false;
                }

                if (isCompleted) completedCount++;

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
              progress: completedCount,
              total: allLessons.length,
              lessons: allLessons
            };
          })
        );
      })
    );
  }

  navigateToLesson(lesson: Lesson): void {
    if (!lesson.locked && lesson.id) {
      this.router.navigate(['/lesson', lesson.id], {
        queryParams: {
          courseId:     lesson.courseId,
          sectionOrder: lesson.sectionOrder,
          lessonOrder:  lesson.lessonOrder
        }
      });
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { LearningService, CourseDTO } from '../../services/learning.service';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

// ── Domain models ──────────────────────────────────────────────────────────────

interface Module {
  title: string;
  locked: boolean;
  completed: boolean;
  lessonsCompleted: number;
  totalLessons: number;
  // navigation: first uncompleted lesson (or first lesson for review)
  nextLessonId?: string;
  nextCourseId?: number;
  nextSectionOrder?: number;
  nextLessonOrder?: number;
}

interface LearningPath {
  title: string;
  subtitle: string;
  progress: number;   // modules fully completed
  total: number;      // total modules
  modules: Module[];
}

// ── Map layout models ──────────────────────────────────────────────────────────

interface NodePos {
  x: number;
  y: number;
  module: Module;
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

const NODES_PER_ROW = 5;
const SPACING_X     = 220;
const SPACING_Y     = 200;
const PAD_X         = 120;
const PAD_Y         = 110;

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
      catchError(() => of([]))
    ).subscribe(paths => {
      // Unlock first module of course N when course N-1 is fully completed
      for (let i = 1; i < paths.length; i++) {
        const prev = paths[i - 1];
        if (prev.total > 0 && prev.progress === prev.total && paths[i].modules.length > 0) {
          paths[i].modules[0].locked = false;
        }
      }
      this.layouts = paths.map(p => this.buildLayout(p));
    });
  }

  // ── Layout computation ───────────────────────────────────────────────────────

  private buildLayout(path: LearningPath): PathLayout {
    const nodes: NodePos[] = path.modules.map((module, i) => {
      const row      = Math.floor(i / NODES_PER_ROW);
      const col      = i % NODES_PER_ROW;
      const reversed = row % 2 === 1;
      const x = reversed
        ? PAD_X + (NODES_PER_ROW - 1 - col) * SPACING_X
        : PAD_X + col * SPACING_X;
      const y = PAD_Y + row * SPACING_Y;
      return { x, y, module };
    });

    const segments: Segment[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      const from = nodes[i];
      const to   = nodes[i + 1];
      let cssClass: string;
      if (from.module.completed && to.module.completed) {
        cssClass = 'seg-done';
      } else if (from.module.completed && !to.module.locked) {
        cssClass = 'seg-current';
      } else {
        cssClass = 'seg-locked';
      }
      segments.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y, cssClass });
    }

    const rows      = Math.ceil(path.modules.length / NODES_PER_ROW);
    const svgWidth  = PAD_X * 2 + (NODES_PER_ROW - 1) * SPACING_X;
    const svgHeight = PAD_Y * 2 + Math.max(rows - 1, 0) * SPACING_Y;

    return { path, nodes, segments, svgWidth, svgHeight };
  }

  // ── Data loading ─────────────────────────────────────────────────────────────

  private buildLearningPath(course: CourseDTO, isFirstCourse: boolean): Observable<LearningPath> {
    return forkJoin({
      sections: this.learningService.getSectionsByCourse(course.id),
      progress: this.learningService.getUserProgress(course.id).pipe(catchError(() => of(null)))
    }).pipe(
      switchMap(({ sections, progress }) => {
        if (!sections || sections.length === 0) {
          return of({ title: course.title, subtitle: course.description, progress: 0, total: 0, modules: [] });
        }

        sections.sort((a, b) => a.listOrder - b.listOrder);
        const lessonsObs = sections.map(sec => this.learningService.getLessonsBySection(sec.id));

        return forkJoin(lessonsObs).pipe(
          map(nestedLessons => {
            const allModules: Module[] = [];
            let completedModules = 0;

            nestedLessons.forEach((sectionLessons, idx) => {
              const section = sections[idx];
              sectionLessons.sort((a, b) => a.listOrder - b.listOrder);

              // ── Determine module state ────────────────────────────────────
              let moduleCompleted: boolean;
              let moduleLocked: boolean;
              let lessonsCompleted: number;

              if (progress) {
                moduleCompleted = section.listOrder < progress.currentSectionOrder;
                moduleLocked    = section.listOrder > progress.currentSectionOrder;

                if (moduleCompleted) {
                  lessonsCompleted = sectionLessons.length;
                } else if (!moduleLocked) {
                  // current section: count lessons already past
                  lessonsCompleted = sectionLessons.filter(
                    l => l.listOrder < progress.currentLessonOrder
                  ).length;
                } else {
                  lessonsCompleted = 0;
                }
              } else {
                moduleCompleted  = false;
                moduleLocked     = !(isFirstCourse && section.listOrder === 1);
                lessonsCompleted = 0;
              }

              if (moduleCompleted) completedModules++;

              // ── Determine navigation target ───────────────────────────────
              // Always compute so that cross-course unlock works immediately.
              let targetLesson = sectionLessons[0];

              if (!moduleCompleted && progress && !moduleLocked) {
                // in-progress: go to the current lesson
                targetLesson = sectionLessons.find(
                  l => l.listOrder === progress.currentLessonOrder
                ) ?? sectionLessons[0];
              }

              allModules.push({
                title:            section.title,
                locked:           moduleLocked,
                completed:        moduleCompleted,
                lessonsCompleted,
                totalLessons:     sectionLessons.length,
                nextLessonId:     targetLesson?.id.toString(),
                nextCourseId:     course.id,
                nextSectionOrder: section.listOrder,
                nextLessonOrder:  targetLesson?.listOrder
              });
            });

            return {
              title:    course.title,
              subtitle: course.description,
              progress: completedModules,
              total:    allModules.length,
              modules:  allModules
            };
          })
        );
      })
    );
  }

  navigateToModule(module: Module): void {
    if (!module.locked && module.nextLessonId) {
      this.router.navigate(['/lesson', module.nextLessonId], {
        queryParams: {
          courseId:     module.nextCourseId,
          sectionOrder: module.nextSectionOrder,
          lessonOrder:  module.nextLessonOrder
        }
      });
    }
  }
}

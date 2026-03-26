import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Exercise {
  id: number;
  title: string;
  theory: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface SectionDetails {
  id: string;
  title: string;
  theoryContent: string;
  codeExample: string;
  codeLanguage: string;
  exercises: Exercise[];
}

export interface CourseDTO {
  id: number;
  title: string;
  description: string;
}

export interface SectionDTO {
  id: number;
  title: string;
  listOrder: number;
}

export interface LessonDTO {
  id: number;
  title: string;
  theoryContent: string;
  codeExample: string;
  codeLanguage: string;
  listOrder: number;
}

export interface ExerciseDTO {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  lessonId: number;
}

export interface UserProgressDTO {
  id: number;
  userId: number;
  courseId: number;
  currentSectionOrder: number;
  currentLessonOrder: number;
}

@Injectable({
  providedIn: 'root'
})
export class LearningService {
  private apiUrl = `${environment.apiUrl}/api/learning-path`;
  private progressUrl = `${environment.apiUrl}/api/progress`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Authorization': 'Bearer ' + token
      })
    };
  }

  getLessonGlobalIndex(lessonId: string): number {
    return parseInt(lessonId, 10);
  }

  getUserProgress(courseId: number): Observable<UserProgressDTO> {
    return this.http.get<UserProgressDTO>(`${this.progressUrl}/${courseId}`, this.getAuthHeaders());
  }

  completeLesson(courseId: number, currentSectionOrder: number, currentLessonOrder: number): Observable<UserProgressDTO> {
    return this.http.post<UserProgressDTO>(
      `${this.progressUrl}/complete-lesson?courseId=${courseId}&currentSectionOrder=${currentSectionOrder}&currentLessonOrder=${currentLessonOrder}`,
      {},
      this.getAuthHeaders()
    );
  }

  getCourses(): Observable<CourseDTO[]> {
    return this.http.get<CourseDTO[]>(this.apiUrl + '/courses', this.getAuthHeaders());
  }

  getSectionsByCourse(courseId: number): Observable<SectionDTO[]> {
    return this.http.get<SectionDTO[]>(this.apiUrl + '/courses/' + courseId + '/sections', this.getAuthHeaders());
  }

  getLessonsBySection(sectionId: number): Observable<LessonDTO[]> {
    return this.http.get<LessonDTO[]>(this.apiUrl + '/sections/' + sectionId + '/lessons', this.getAuthHeaders());
  }

  getExercisesByLesson(lessonId: number): Observable<ExerciseDTO[]> {
    return this.http.get<ExerciseDTO[]>(this.apiUrl + '/lessons/' + lessonId + '/exercises', this.getAuthHeaders());
  }

  getLessonById(lessonId: number): Observable<LessonDTO> {
    return this.http.get<LessonDTO>(`${this.apiUrl}/lessons/${lessonId}`, this.getAuthHeaders());
  }

  getSectionDetails(id: string): Observable<SectionDetails> {
    const lessonId = parseInt(id, 10);
    return forkJoin({
      lesson: this.getLessonById(lessonId),
      exercises: this.getExercisesByLesson(lessonId)
    }).pipe(
      map(({ lesson, exercises }) => {
        const mappedExercises: Exercise[] = exercises.slice(0, 1).map((ex, index) => ({
          id: ex.id,
          title: 'Questão ' + (index + 1),
          theory: ex.question,
          options: ex.options,
          correctAnswerIndex: ex.correctAnswer
        }));

        return {
          id: id,
          title: lesson.title,
          theoryContent: lesson.theoryContent || '',
          codeExample: lesson.codeExample || '',
          codeLanguage: lesson.codeLanguage || 'javascript',
          exercises: mappedExercises
        };
      })
    );
  }
}

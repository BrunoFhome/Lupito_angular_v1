import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, delay } from 'rxjs/operators';

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
  private apiUrl = 'http://localhost:8081/api/learning-path';
  private progressUrl = 'http://localhost:8081/api/progress';

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

  getUserProgress(courseId: number, userId: number): Observable<UserProgressDTO> {
    return this.http.get<UserProgressDTO>(`${this.progressUrl}/${courseId}?userId=${userId}`, this.getAuthHeaders());
  }

  completeLesson(userId: number, courseId: number, currentSectionOrder: number, currentLessonOrder: number): Observable<UserProgressDTO> {
    return this.http.post<UserProgressDTO>(
      `${this.progressUrl}/complete-lesson?userId=${userId}&courseId=${courseId}&currentSectionOrder=${currentSectionOrder}&currentLessonOrder=${currentLessonOrder}`, 
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

  getSectionDetails(id: string): Observable<SectionDetails> {
    const lessonId = parseInt(id, 10);
    return this.getExercisesByLesson(lessonId).pipe(
      map(exercisesDto => {
        const mappedExercises: Exercise[] = exercisesDto.map((ex, index) => {
           return {
             id: ex.id,
             title: 'Questão ' + (index + 1),
             theory: ex.question,
             options: ex.options,
             correctAnswerIndex: ex.correctAnswer
           };
        });

        return {
          id: id,
          title: 'Aula ' + id,
          exercises: mappedExercises
        };
      })
    );
  }
}

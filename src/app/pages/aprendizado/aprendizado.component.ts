import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { LearningService } from '../../services/learning.service';

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

  paths: LearningPath[] = [
    {
      title: "Logic with JavaScript",
      subtitle: "Trilha de Lógica - Iniciante",
      progress: 0,
      total: 10,
      lessons: [
        { title: 'Introdução', locked: true, id: 'logic-1' },
        { title: 'Variáveis', locked: true, id: 'logic-2' },
        { title: 'Tipos', locked: true, id: 'logic-3' },
        { title: 'Condicionais', locked: true, id: 'logic-4' },
        { title: 'Laços', locked: true, id: 'logic-5' },
        { title: 'Funções', locked: true, id: 'logic-6' },
        { title: 'Arrays', locked: true, id: 'logic-7' },
        { title: 'Objetos', locked: true, id: 'logic-8' },
        { title: 'Eventos', locked: true, id: 'logic-9' },
        { title: 'Projeto', locked: true, id: 'logic-10' }
      ]
    },
    {
      title: "Html CSS and JS",
      subtitle: "Trilha Web - Iniciante",
      progress: 0,
      total: 10,
      lessons: [
        { title: 'HTML Básico', locked: true, id: 'web-1' },
        { title: 'Tags Textuais', locked: true, id: 'web-2' },
        { title: 'Estruturação', locked: true, id: 'web-3' },
        { title: 'CSS Básico', locked: true, id: 'web-4' },
        { title: 'Box Model', locked: true, id: 'web-5' },
        { title: 'Flexbox', locked: true, id: 'web-6' },
        { title: 'Grid', locked: true, id: 'web-7' },
        { title: 'JS na Web', locked: true, id: 'web-8' },
        { title: 'Manipulação DOM', locked: true, id: 'web-9' },
        { title: 'Projeto Final', locked: true, id: 'web-10' }
      ]
    }
  ];

  constructor(
    private router: Router, 
    private authService: AuthService,
    private learningService: LearningService
  ) {}

  ngOnInit(): void {
    // Populate global indices
    this.paths.forEach(path => {
      path.lessons.forEach(lesson => {
        if (lesson.id) {
          lesson.globalIndex = this.learningService.getLessonGlobalIndex(lesson.id);
        }
      });
    });

    this.authService.getCurrentUser().subscribe(u => {
      this.user = u;
      let userProgress = (u && u.learningProgress) ? u.learningProgress : 0;
      this.applyProgress(userProgress);
    });
  }

  applyProgress(learningProgress: number): void {
    // Calculate path progress
    let logicCompleted = Math.min(learningProgress, 10);
    this.paths[0].progress = logicCompleted;
    
    let webCompleted = Math.max(0, Math.min(learningProgress - 10, 10));
    this.paths[1].progress = webCompleted;

    // A lesson is unlocked if its globalIndex <= learningProgress
    this.paths.forEach(path => {
      path.lessons.forEach(lesson => {
        if (lesson.globalIndex !== undefined) {
          lesson.locked = lesson.globalIndex > learningProgress;
        }
      });
    });
  }

  navigateToLesson(lesson: Lesson) {
    if (!lesson.locked && lesson.id) {
      this.router.navigate(['/lesson', lesson.id]);
    }
  }
}

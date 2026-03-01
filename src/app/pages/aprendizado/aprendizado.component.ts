import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Lesson {
  title: string;
  locked: boolean;
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
export class AprendizadoComponent {
  paths: LearningPath[] = [
    {
      title: "Logic with JavaScript",
      subtitle: "Trilha de Lógica - Iniciante",
      progress: 1,
      total: 10,
      lessons: [
        { title: 'Introdução', locked: false },
        { title: 'Variáveis', locked: true },
        { title: 'Tipos', locked: true },
        { title: 'Condicionais', locked: true },
        { title: 'Laços', locked: true },
        { title: 'Funções', locked: true },
        { title: 'Arrays', locked: true },
        { title: 'Objetos', locked: true },
        { title: 'Eventos', locked: true },
        { title: 'Projeto', locked: true }
      ]
    },
    {
      title: "Html CSS and JS",
      subtitle: "Trilha Web - Iniciante",
      progress: 0,
      total: 10,
      lessons: [
        { title: 'HTML Básico', locked: false },
        { title: 'Tags Textuais', locked: true },
        { title: 'Estruturação', locked: true },
        { title: 'CSS Básico', locked: true },
        { title: 'Box Model', locked: true },
        { title: 'Flexbox', locked: true },
        { title: 'Grid', locked: true },
        { title: 'JS na Web', locked: true },
        { title: 'Manipulação DOM', locked: true },
        { title: 'Projeto Final', locked: true }
      ]
    }
  ];
}

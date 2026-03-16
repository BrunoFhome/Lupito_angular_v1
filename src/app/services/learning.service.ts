import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

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

@Injectable({
  providedIn: 'root'
})
export class LearningService {

  constructor() { }

  getLessonGlobalIndex(lessonId: string): number {
    const defaultOrder = [
      'logic-1', 'logic-2', 'logic-3', 'logic-4', 'logic-5',
      'logic-6', 'logic-7', 'logic-8', 'logic-9', 'logic-10',
      'web-1', 'web-2', 'web-3', 'web-4', 'web-5',
      'web-6', 'web-7', 'web-8', 'web-9', 'web-10'
    ];
    return defaultOrder.indexOf(lessonId);
  }

  // Simulated method to fetch section data (3 exercises) based on section ID
  getSectionDetails(id: string): Observable<SectionDetails> {
    const mockData: SectionDetails = {
      id: id,
      title: `Lógica de Programação - Seção ${id}`,
      exercises: [
        {
          id: 1,
          title: 'Exercício 1: O que é uma Variável?',
          theory: 'Variáveis são espaços reservados na memória do computador para armazenar dados que serão utilizados durante a execução de um programa.',
          options: [
            'Uma função matemática para calcular equações.',
            'Um espaço na memória do computador usado para armazenar dados.',
            'Um tipo especial de loop infinito.',
            'Um dispositivo de hardware do computador.'
          ],
          correctAnswerIndex: 1
        },
        {
          id: 2,
          title: 'Exercício 2: Tipos de Dados',
          theory: 'Os tipos de dados definem o formato dos dados que uma variável pode conter. Exemplos comuns: Inteiro (números inteiros), Textos/Strings (caracteres) e Booleanos (Verdadeiro ou Falso).',
          options: [
            'Sempre precisamos usar números.',
            'Um tipo booleano só pode receber valores Verdadeiro ou Falso.',
            'Textos não podem ser guardados em variáveis.',
            'Inteiros aceitam casas decimais.'
          ],
          correctAnswerIndex: 1
        },
        {
          id: 3,
          title: 'Exercício 3: Atribuição',
          theory: 'A atribuição é a ação de guardar um valor em uma variável, comumente usando o sinal de igualdade "=" em muitas linguagens de programação (ex: x = 10).',
          options: [
            'O sinal "=" é utilizado para dar o valor da direita à variável da esquerda.',
            'O sinal "=" só serve para comparar valores.',
            'Atribuir significa apagar uma variável da memória.',
            'Devemos usar "+" para guardar valores nas variáveis.'
          ],
          correctAnswerIndex: 0
        }
      ]
    };

    return of(mockData).pipe(delay(500)); // Simulate network delay
  }
}


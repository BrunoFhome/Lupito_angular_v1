import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { KanbanService, KanbanTask } from '../../services/kanban.service';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, MonacoEditorModule],
  templateUrl: './workspace.component.html',
  styleUrl: './workspace.component.css'
})
export class WorkspaceComponent implements OnInit {
  task: KanbanTask | null = null;
  
  editorOptions = {
    theme: 'vs-dark',
    language: 'javascript',
    minimap: { enabled: false },
    fontSize: 14,
    automaticLayout: true
  };

  code: string = `// Escreva sua solução aqui
function resolverDesafio() {
  console.log("Olá, mundo!");
}

resolverDesafio();
`;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private kanbanService: KanbanService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const taskId = params.get('taskId');
      if (taskId) {
        this.kanbanService.getTasks().subscribe(tasks => {
          this.task = tasks.find(t => t.id === taskId) || null;
        });
      }
    });
  }

  goBack() {
    this.router.navigate(['/kanban']);
  }

  runCode() {
    console.log("Executando código:\n", this.code);
    alert("Código executado! (Simulação para agora)");
    // A real implementation might safely eval() the code or send to a backend
  }

  submitProject() {
    if (this.task) {
        this.kanbanService.updateTaskStatus(this.task.id, 'in-review');
        this.router.navigate(['/kanban']);
    }
  }
}

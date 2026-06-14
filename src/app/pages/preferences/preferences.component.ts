import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './preferences.component.html',
  styleUrl: './preferences.component.css'
})
export class PreferencesComponent implements OnInit {
  private readonly STORAGE_KEY = 'userPreferences';

  darkMode = false;

  ngOnInit(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (!saved) {
      return;
    }
    try {
      const prefs = JSON.parse(saved);
      if (typeof prefs.darkMode === 'boolean') {
        this.darkMode = prefs.darkMode;
      }
    } catch {
      // preferências corrompidas: mantém os valores padrão
    }
  }

  save(): void {
    const prefs: Record<string, boolean> = { darkMode: this.darkMode };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(prefs));
  }
}

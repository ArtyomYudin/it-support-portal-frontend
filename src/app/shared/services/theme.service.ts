import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'clarity-theme';
  private body: HTMLElement = document.body;

  initTheme(): void {
    const savedTheme = localStorage.getItem(this.THEME_KEY) as 'light' | 'dark' | null;
    const theme = savedTheme || this.getSystemPreference();
    this.setTheme(theme);
  }

  toggleTheme(): void {
    const current = this.getCurrentTheme();
    const newTheme = current === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    localStorage.setItem(this.THEME_KEY, newTheme);
  }

  private setTheme(theme: 'light' | 'dark'): void {
    this.body.setAttribute('cds-theme', theme);
  }

  private getCurrentTheme(): 'light' | 'dark' {
    return (this.body.getAttribute('cds-theme') as 'light' | 'dark') || 'light';
  }

  private getSystemPreference(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}

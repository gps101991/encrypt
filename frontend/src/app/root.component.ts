import { Component } from '@angular/core'
import { RouterLink, RouterOutlet } from '@angular/router'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <nav class="navbar navbar-expand navbar-light bg-light px-3">
      <a class="navbar-brand" href="#">Encrypt Tool</a>
      <ul class="navbar-nav me-auto">
        <li class="nav-item"><a routerLink="/encrypt" class="nav-link">Encrypt</a></li>
        <li class="nav-item"><a routerLink="/decrypt" class="nav-link">Decrypt</a></li>
      </ul>
    </nav>
    <div class="container my-4">
      <router-outlet></router-outlet>
    </div>
  `,
})
export class AppComponent {}



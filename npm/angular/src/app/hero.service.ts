import { Injectable } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class HeroService {
  /** GET heroes from the server */
  getHeroes(): string[] {
    return ['toto', 'titi']
  }
}

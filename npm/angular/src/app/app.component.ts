import { Component, OnInit } from '@angular/core'
import { HeroService } from './hero.service'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'angular-project'
  list: string[]

  constructor(private service: HeroService) {}

  ngOnInit(): void {
    this.list = this.service.getHeroes()
  }
}

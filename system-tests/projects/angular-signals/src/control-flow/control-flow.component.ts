import {
  ChangeDetectionStrategy,
  Component,
  model,
} from '@angular/core'

export type SuperHero = {
  name: string
  nickname: string
  age: number
  isMortal: boolean
}

@Component({
  selector: 'control-flow-component',
  templateUrl: './control-flow.component.html',
  styleUrls: ['./control-flow.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlFlowComponent {
  superHeroes = model.required<SuperHero[]>()
}

import { Pipe, PipeTransform } from '@angular/core'

@Pipe({
  name: 'capitalize',
})
export class CapitalizePipe implements PipeTransform {
  transform(value: string, ...args: unknown[]): string {
    return value.toUpperCase()
  }
}

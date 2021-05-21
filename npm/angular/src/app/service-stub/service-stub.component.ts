import { Component, OnInit } from '@angular/core'
import { MyValuesService } from '../my-values.service'

@Component({
  selector: 'app-service-stub',
  templateUrl: './service-stub.component.html',
})
export class ServiceStubComponent implements OnInit {
  values: string[]

  valuesObservable: string[]

  constructor(private myValuesService: MyValuesService) {}

  ngOnInit() {
    this.values = this.myValuesService.getValues()
    this.myValuesService.getValuesObservable().subscribe((values) => (this.valuesObservable = values))
  }
}

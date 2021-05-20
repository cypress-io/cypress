import { Component, OnInit } from '@angular/core'
import { NetworkService } from '../network.service'

@Component({
  selector: 'app-network',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.css'],
})
export class NetworkComponent implements OnInit {
  users = [];

  constructor (private networkService: NetworkService) {}

  ngOnInit (): void {
    this.networkService
    .getUsers()
    .subscribe((response) => (this.users = response))
  }
}

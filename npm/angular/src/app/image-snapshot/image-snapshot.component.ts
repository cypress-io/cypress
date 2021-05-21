import { Component, OnInit } from '@angular/core'

@Component({
  selector: 'app-image-snapshot',
  templateUrl: './image-snapshot.component.html',
  styleUrls: ['./image-snapshot.component.css'],
})
export class ImageSnapshotComponent implements OnInit {
  clicked = false

  ngOnInit(): void {}

  clic() {
    this.clicked = true
  }
}

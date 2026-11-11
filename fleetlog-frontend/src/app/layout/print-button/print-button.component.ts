import { Component, Input } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-print-button',
  styleUrl: './print-button.component.scss',
  templateUrl: './print-button.component.html',
})

export class PrintButton {

  @Input() label = 'Imprimer';

  imprimer(): void {
    window.print();
  }
}

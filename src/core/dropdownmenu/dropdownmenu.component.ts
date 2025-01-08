import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'wisdom-dropdownmenu',
  imports: [CommonModule],
  templateUrl: './dropdownmenu.component.html',
  styles: ``
})
export class DropdownmenuComponent {

  @Input() menuName: string = "Test"

  @Input() options: string[] = ["A", "B", "C"
  ]
}

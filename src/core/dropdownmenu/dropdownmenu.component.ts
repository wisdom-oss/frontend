import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'wisdom-dropdownmenu',
  imports: [CommonModule],
  templateUrl: './dropdownmenu.component.html',
  styles: ``
})
export class DropdownmenuComponent {

  /**
   * module name, when no name applied -> Test
   */
  @Input() menuName: string = "Test"

  /**
   * default options if no array is submitted.
   */
  @Input() options: string[] = ["A", "B", "C"
  ]

  /**
   * event emitter submitting chosen option to parent component
   */
  @Output() choiceChange = new EventEmitter<string>();

  /**
   * chosen option, empty if none is chosen yet
   */
  choice!: string

  /**
   * stop event from misshappening, reselecting choice attribute,
   * emitting choice to parent component
   * @param newChoice selected choice in dropdown
   * @param event emitter to transport chosen choice
   */
  safeChoice(newChoice: string, event: Event): void {
    event.preventDefault();
    this.choice = newChoice;
    this.choiceChange.emit(this.choice);
  }
}

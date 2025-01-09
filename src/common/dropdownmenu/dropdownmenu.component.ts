import {Component, EventEmitter, input, Output, signal} from "@angular/core";

@Component({
  selector: 'dropdown',
  standalone: true,
  imports: [],
  templateUrl: './dropdownmenu.component.html',
  styles: ``
})

export class DropdownmenuComponent {
  /**
   * module name, when no name applied -> Test
   */  
    menuName = input("Test");
  
  /**
   * default options if no array is submitted.
   */
  options = input(["A","B","C"]);

  /**
   * event emitter submitting chosen option to parent component
   */
  @Output() choiceChange = new EventEmitter<string>();

  /**
   * chosen option, empty if none is chosen yet
   */
  choice = signal("");

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
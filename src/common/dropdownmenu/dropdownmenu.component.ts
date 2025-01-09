import {Component, input, signal} from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: 'dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdownmenu.component.html',
  styles: ``
})

export class DropdownmenuComponent {
 
  /**
   * name of menu with default value
   */
  menuName = input("Test");

  /**
   * default options if no new are provided
   */
  options = input(["A", "B", "C"]); 

  /**
   * flag, if menu name should change after option select
   * default true
   */
  changeMenuName = input(true);

  /**
   * selected choice, to process
   */
  choice = signal("");

  /**
   * toggle if dropdown is hoverable or clickable
   * true hoverable
   * false clickable
   * default false
   */
  toggleHoverable = false;

  /**
   * tracks state of dropdown
   */
  isDropdownOpen = false;

  /**
   * set the selected choice
   * @param selected chosen option
   */
  selectChoice(selected: string): void {
    this.choice.set(selected);
    console.log('Selected choice:', this.choice());
  }

  /**
   * open/close dropdown when toggleHoverable is false
   */
  toggleDropdown() {
    if (!this.toggleHoverable) {
      this.isDropdownOpen = !this.isDropdownOpen;
    }
  }

}
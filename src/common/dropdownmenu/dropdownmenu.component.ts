import {Component, input, signal, output, effect, computed} from "@angular/core";
import { CommonModule} from "@angular/common";
import { NgIconComponent, provideIcons } from "@ng-icons/core";
import { remixArrowDownSLine, remixArrowUpSLine } from "@ng-icons/remixicon";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";

@Component({
  selector: 'dropdown',
  standalone: true,
  imports: [CommonModule, NgIconComponent, TranslatePipe],
  templateUrl: './dropdownmenu.component.html',
  styles: ``,
  providers: [
    provideIcons({
      remixArrowDownSLine,
      remixArrowUpSLine
    })
  ]
})
export class DropdownmenuComponent {
 
  /** Name of menu. */
  readonly menuName = input.required<string>();

  /** Selectable options of the menu. */
  readonly options = input.required<Record<string, string>>(); 
  protected readonly optionsIter = computed(() => Object.entries(this.options()));

  /**
   * Flag, if menu name should display selected choice.
   * @default true
   */
  readonly changeMenuName = input(true);

  /** Selected choice. */
  readonly choice = signal<string | undefined>(undefined);
  protected choiceOutput = output<string>({alias: "choice"});
  protected choiceName = computed(() => {
    let choice = this.choice();
    if (choice) return this.options()[choice];
    return this.menuName();
  });

  /** Define the kind of dropdown menu. */
  readonly kind = input.required<"hover" | "click">();

  protected readonly isActive = signal(false);

  constructor(private translate: TranslateService) {
    effect(() => {
      let choice = this.choice();
      if (choice) this.choiceOutput.emit(choice);
    });
  }
}

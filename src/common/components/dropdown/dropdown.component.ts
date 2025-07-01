import {CommonModule} from "@angular/common";
import {
  computed,
  effect,
  input,
  model,
  output,
  signal,
  Component,
} from "@angular/core";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {remixArrowDownSLine, remixArrowUpSLine} from "@ng-icons/remixicon";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";

@Component({
  selector: "dropdown",
  standalone: true,
  imports: [CommonModule, NgIconComponent, TranslatePipe],
  templateUrl: "./dropdown.component.html",
  styles: ``,
  providers: [
    provideIcons({
      remixArrowDownSLine,
      remixArrowUpSLine,
    }),
  ],
})
export class DropdownComponent {
  /** Name of menu. */
  readonly menuName = input.required<string>();

  /** Selectable options of the menu. */
  readonly options = input.required<Record<string, string>>();
  protected readonly optionsIter = computed(() =>
    Object.entries(this.options()),
  );

  /**
   * Flag, if menu name should display selected choice.
   * @default true
   */
  readonly changeMenuName = input(true);

  /** Selected choice. */
  readonly choice = model<string | undefined>(undefined);
  protected choiceOutput = output<string>({alias: "choice"});
  protected choiceName = computed(() => {
    let choice = this.choice();
    if (choice) return this.options()[choice];
    return this.menuName();
  });

  /** Define the kind of dropdown menu. */
  readonly kind = input.required<"hover" | "click">();

  /** minimum allowed buttonsize in px, format: '200px' */
  readonly buttonSize = input.required<string>();

  protected readonly isActive = signal(false);

  constructor(private translate: TranslateService) {
    effect(() => {
      let choice = this.choice();
      if (choice) this.choiceOutput.emit(choice);
    });
  }
}

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

  /**
   * Flag, if the trigger should take the size of the maximum size value.
   * @default false
   */
  readonly maxWidth = input(false);
  protected readonly possibleDisplays = computed(() => [
    this.menuName(),
    ...this.optionsIter().map(([_, display]) => display),
  ]);

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

  /** Mark the dropdown as disabled. */
  readonly disabled = input<boolean>(false);

  /** Make it dropup instead. */
  readonly isUp = input<boolean>(false, {alias: "is-up"});

  protected readonly isActive = signal(false);

  protected arrowUp = computed(() => {
    let up = this.isUp();
    let active = this.isActive();
    let disabled = this.disabled();
    if (disabled) return !up;
    return up ? active : !active;
  });

  constructor(private translate: TranslateService) {
    effect(() => {
      let choice = this.choice();
      if (choice) this.choiceOutput.emit(choice);
    });
  }
}

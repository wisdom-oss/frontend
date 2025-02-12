import {formatDate, KeyValuePipe} from "@angular/common";
import {computed, input, Component, Signal} from "@angular/core";
import {toSignal} from "@angular/core/rxjs-interop";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import dayjs from "dayjs";
import {map} from "rxjs";

@Component({
  selector: "growl-display-info-control",
  imports: [KeyValuePipe, TranslatePipe],
  templateUrl: "./display-info-control.component.html",
  styles: `
    table {
      border-collapse: unset;
      border-spacing: 0.3rem 0rem;
      margin-left: -0.3rem;
      margin-right: -0.3rem;
    }
  `,
})
export class DisplayInfoControlComponent {
  readonly data = input<DisplayInfoControlComponent.Data | null>();

  protected lang: Signal<string>;
  protected displayData = computed<
    (DisplayInfoControlComponent.Data & {table: Record<string, string>}) | null
  >(() => {
    let lang = this.lang();
    let data = this.data();
    if (!data) return null;
    return {
      title: data.title,
      subtitle: data.subtitle,
      table: Object.fromEntries(
        Object.entries(data.table ?? {}).map(([key, value]) => [
          key,
          this.toDisplay(value, lang),
        ]),
      ),
    };
  });

  constructor(private translate: TranslateService) {
    this.lang = toSignal(
      this.translate.onLangChange.pipe(map(event => event.lang)),
      {initialValue: translate.currentLang},
    );
  }

  protected toDisplay(value: any, lang: string): string {
    if (dayjs.isDayjs(value)) {
      return formatDate(value.toDate(), "longDate", lang)!;
    }

    return value?.toString();
  }
}

export namespace DisplayInfoControlComponent {
  export interface Data {
    title?: string | null;
    subtitle?: string | null;
    table?: Record<string, any> | null;
  }
}

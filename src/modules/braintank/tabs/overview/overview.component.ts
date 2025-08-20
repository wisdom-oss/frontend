import { Component, signal, WritableSignal } from '@angular/core';
import { NgIconComponent, provideIcons } from "@ng-icons/core";
import { remixContrastDrop2Line, remixTimeLine, remixHome8Line, remixMapPin2Line, remixWaterPercentLine } from '@ng-icons/remixicon';
import { TranslateDirective } from '@ngx-translate/core';
import { ModelViewComponent } from "../../model-view/model-view.component";


@Component({
  selector: 'braintank-overview',
  imports: [
    ModelViewComponent,
    TranslateDirective,
    NgIconComponent,
],
  templateUrl: './overview.component.html',
  providers: [
    provideIcons({
      remixContrastDrop2Line,
      remixWaterPercentLine,
      remixTimeLine,
      remixHome8Line,
      remixMapPin2Line,
    }),
  ],
})
export class OverviewComponent {
  waterLevel : WritableSignal<number> = signal(30);
}

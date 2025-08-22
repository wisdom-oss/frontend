import { Component, signal, WritableSignal } from '@angular/core';
import { NgIconComponent, provideIcons } from "@ng-icons/core";
import { remixContrastDrop2Line, remixTimeLine, remixHome8Line, remixMapPin2Line, remixWaterPercentLine } from '@ng-icons/remixicon';
import { TranslateDirective } from '@ngx-translate/core';
import { ModelViewComponent } from "../../model-view/model-view.component";
import dayjs, { Dayjs } from 'dayjs';


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
  time : WritableSignal<Dayjs> = signal(dayjs());
  roofSize : WritableSignal<number> = signal(160);
  lat : WritableSignal<number> = signal(53.146);
  long : WritableSignal<number> = signal(8.185);
  draining : WritableSignal<boolean> = signal(true);
  drainingTime: WritableSignal<Dayjs> = signal(dayjs().subtract(30, 'minutes'));
}

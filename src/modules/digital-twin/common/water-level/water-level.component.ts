import { Component, Input, signal, WritableSignal } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { remixContrastDrop2Line } from '@ng-icons/remixicon';
import { TranslateDirective } from '@ngx-translate/core';

@Component({
  selector: 'water-level',
  imports: [
    TranslateDirective,
    NgIconComponent
  ],
  templateUrl: './water-level.component.html',
  providers: [
    provideIcons({
      remixContrastDrop2Line,
    }),
  ],
})
export class WaterLevelComponent {
  @Input() waterLevelSlider: WritableSignal<number> = signal(0);
  @Input() waterLevel: WritableSignal<number> = signal(this.waterLevelSlider());
}

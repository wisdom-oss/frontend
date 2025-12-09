import { Component, signal, WritableSignal } from '@angular/core';
import { NgIconComponent, provideIcons } from "@ng-icons/core";
import { remixGamepadLine, remixLineChartLine, remixMovieLine, remixProfileLine } from '@ng-icons/remixicon';
import { TranslateDirective } from '@ngx-translate/core';
import { OverviewComponent } from './tabs/overview/overview.component';
import { SimulationComponent } from './tabs/simulation/simulation.component';
import { HistoryComponent } from './tabs/history/history.component';
import { ControlComponent } from "./tabs/control/control.component";
import dayjs, { Dayjs } from 'dayjs';

@Component({
  imports: [
    NgIconComponent,
    TranslateDirective,
    OverviewComponent,
    HistoryComponent,
    SimulationComponent,
    ControlComponent
],
  templateUrl: './rain-retention-basin.component.html',
  providers: [
    provideIcons({
      remixLineChartLine,
      remixMovieLine,
      remixProfileLine,
      remixGamepadLine
    }),
  ],
})
export class RainRetentionBasinComponent {
  protected activeTab: WritableSignal<'overview' | 'history' | 'simulation' | 'control'> = signal('overview'); 

  protected time: WritableSignal<Dayjs> = signal(dayjs());
  protected waterLevel: WritableSignal<number> = signal(30);

  protected lat: WritableSignal<number> = signal(52.524639);
  protected long: WritableSignal<number> = signal(8.185833);
  protected city: WritableSignal<string> = signal('Damme');
  protected name: WritableSignal<string> = signal('Zum Griechen');

  protected volume: WritableSignal<number> = signal(100);
  protected catchmentArea: WritableSignal<number> = signal(100);
  protected pavedArea: WritableSignal<number> = signal(50);
  protected unpavedArea: WritableSignal<number> = signal(50);  

  setActiveTab(tab: 'overview' | 'history' | 'simulation'| 'control') {
    this.activeTab.set(tab);
  }
}

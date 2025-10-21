import { Component, signal } from '@angular/core';
import { NgIconComponent, provideIcons } from "@ng-icons/core";
import { remixGamepadLine, remixLineChartLine, remixMovieLine, remixProfileLine } from '@ng-icons/remixicon';
import { TranslateDirective } from '@ngx-translate/core';
import { OverviewComponent } from './tabs/overview/overview.component';
import { SimulationComponent } from './tabs/simulation/simulation.component';
import { HistoryComponent } from './tabs/history/history.component';
import { ControlComponent } from "./tabs/control/control.component";

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
  protected activeTab = signal<'overview' | 'history' | 'simulation' | 'control'>('overview'); 

  setActiveTab(tab: 'overview' | 'history' | 'simulation'| 'control') {
    this.activeTab.set(tab);
  }
}

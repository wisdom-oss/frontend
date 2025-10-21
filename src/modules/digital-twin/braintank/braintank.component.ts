import { Component, signal } from '@angular/core';
import { NgIconComponent, provideIcons } from "@ng-icons/core";
import { remixLineChartLine, remixMovieLine, remixProfileLine } from '@ng-icons/remixicon';
import { TranslateDirective } from '@ngx-translate/core';
import { OverviewComponent } from './tabs/overview/overview.component';
import { SimulationComponent } from './tabs/simulation/simulation.component';
import { HistoryComponent } from './tabs/history/history.component';

@Component({
  imports: [
    NgIconComponent, 
    TranslateDirective,
    OverviewComponent,
    HistoryComponent,
    SimulationComponent,
  ],
  templateUrl: './braintank.component.html',
  providers: [
    provideIcons({
      remixLineChartLine,
      remixMovieLine,
      remixProfileLine,
    }),
  ],
})
export class BraintankComponent {
  protected activeTab = signal<'overview' | 'history' | 'simulation'>('overview'); 

  setActiveTab(tab: 'overview' | 'history' | 'simulation') {
    this.activeTab.set(tab);
  }
}

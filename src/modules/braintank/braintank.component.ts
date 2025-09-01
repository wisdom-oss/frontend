import { Component, signal } from '@angular/core';
import { NgIconComponent, provideIcons } from "@ng-icons/core";
import { remixLineChartLine, remixMovieLine } from '@ng-icons/remixicon';
import { TranslateDirective } from '@ngx-translate/core';
import { OverviewComponent } from './tabs/overview/overview.component';
import { SimulationComponent } from './tabs/simulation/simulation.component';

@Component({
  imports: [
    NgIconComponent, 
    TranslateDirective,
    OverviewComponent,
    SimulationComponent,
  ],
  templateUrl: './braintank.component.html',
  providers: [
    provideIcons({
      remixLineChartLine,
      remixMovieLine,
    }),
  ],
})
export class BraintankComponent {
  protected activeTab = signal<'overview' | 'simulation'>('overview'); 

  setActiveTab(tab: 'overview' | 'simulation') {
    this.activeTab.set(tab);
  }
}

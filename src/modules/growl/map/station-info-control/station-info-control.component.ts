import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { Dayjs } from 'dayjs';

@Component({
  selector: 'growl-station-info-control',
  imports: [DatePipe],
  templateUrl: './station-info-control.component.html',
  styles: `table {
    border-collapse: unset;
    border-spacing: 0.3rem 0rem;
    margin-left: -0.3rem;
    margin-right: -0.3rem;
  }`
})
export class StationInfoControlComponent {
  readonly data = input<StationInfoControlComponent.Display>();
}

export namespace StationInfoControlComponent {
  export interface Display {
    name: string,
    station: string,
    date: Dayjs,
    waterLevelNHN?: number,
    waterLevelGOK?: number,
  }
}

import { Component, signal, WritableSignal } from '@angular/core';
import { CarouselComponent } from "../../../common/carousel/carousel.component";
import { NgIconComponent, provideIcons } from "@ng-icons/core";
import { 
  remixContrastDrop2Line, 
  remixTimeLine, 
  remixHome8Line, 
  remixMapPin2Line, 
  remixWaterPercentLine, 
  remixRainyLine, 
  remixMap2Fill, 
  remixImageFill, 
  remixCheckboxMultipleBlankFill, 
  remixMapPin2Fill, 
  remixArrowLeftWideLine,
  remixArrowRightWideLine
} from '@ng-icons/remixicon';
import dayjs, { Dayjs } from 'dayjs';
import { ChartData } from 'chart.js';
import { StyleSpecification } from 'maplibre-gl';
import colorful from "../../../../../assets/map/styles/colorful.json";
import { TranslateDirective } from '@ngx-translate/core';
import { BaseChartDirective } from 'ng2-charts';
import { MapViewComponent } from "../../../common/map-view/map-view.component";

@Component({
  selector: "rrb-overview",
  imports: [
    TranslateDirective,
    NgIconComponent,
    BaseChartDirective,
    CarouselComponent,
    MapViewComponent
],
  templateUrl: './overview.component.html',
  providers: [
    provideIcons({
      remixContrastDrop2Line,
      remixWaterPercentLine,
      remixTimeLine,
      remixHome8Line,
      remixMapPin2Line,
      remixRainyLine,
      remixMap2Fill,
      remixImageFill,
      remixCheckboxMultipleBlankFill,
      remixMapPin2Fill,
      remixArrowLeftWideLine,
      remixArrowRightWideLine,
    }),
  ],
})
export class OverviewComponent {
  protected activeView = signal<'model' | 'map' | 'pictures'>('model'); 

  setActiveView(view: 'model' | 'map' | 'pictures') {
    this.activeView.set(view);
  }

  time : WritableSignal<Dayjs> = signal(dayjs());
  waterLevel : WritableSignal<number> = signal(30);
  lat : WritableSignal<number> = signal(52.524639);
  long : WritableSignal<number> = signal(8.185833);

  dataCurrentForecast: ChartData<'bar', {x: string, y: number}[]> = {
      datasets: [{
        data: [{x: '16:00', y: 0}, {x: '16:15', y: 0}, {x: '16:30', y: 3}, {x: '16:45', y: 2}, {x: '17:00', y: 0}, {x: '17:15', y: 0}, {x: '17:30', y: 6}, {x: '17:45', y: 8}],
        parsing: {
          xAxisKey: 'x',
          yAxisKey: 'y'
        },
      }],
    };
  
  protected style = colorful as any as StyleSpecification;
  
  protected locations : GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [this.long(), this.lat()]
        },
        properties: {
          name: 'Test Point'
        }
      }
    ]
  };
}

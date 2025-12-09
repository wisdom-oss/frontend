import { Component, Input, signal, WritableSignal } from '@angular/core';
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
  remixArrowRightWideLine,
  remixCommunityLine,
  remixInfoCardLine,
  remixTreeLine,
  remixCollageLine,
  remixBox2Line
} from '@ng-icons/remixicon';
import dayjs, { Dayjs } from 'dayjs';
import { ChartData } from 'chart.js';
import { StyleSpecification } from 'maplibre-gl';
import colorful from "../../../../../assets/map/styles/colorful.json";
import { TranslateDirective } from '@ngx-translate/core';
import { BaseChartDirective } from 'ng2-charts';
import { MapViewComponent } from "../../../common/map-view/map-view.component";
import { ModelViewComponent } from "../../../common/model-view/model-view.component";

@Component({
  selector: "rrb-overview",
  imports: [
    TranslateDirective,
    NgIconComponent,
    BaseChartDirective,
    CarouselComponent,
    MapViewComponent,
    ModelViewComponent
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
      remixCommunityLine,
      remixInfoCardLine,
      remixTreeLine,
      remixCollageLine,
      remixBox2Line
    }),
  ],
})
export class OverviewComponent {
  @Input() time: WritableSignal<Dayjs> = signal(dayjs());
  @Input() waterLevel: WritableSignal<number> = signal(30);
  
  @Input() lat: WritableSignal<number> = signal(52.524639);
  @Input() long: WritableSignal<number> = signal(8.185833);
  @Input() city: WritableSignal<string> = signal('Damme');
  @Input() name: WritableSignal<string> = signal('Zum Griechen');
  
  @Input() volume: WritableSignal<number> = signal(100);
  @Input() catchmentArea: WritableSignal<number> = signal(100);
  @Input() pavedArea: WritableSignal<number> = signal(50);
  @Input() unpavedArea: WritableSignal<number> = signal(50); 

  protected activeView: WritableSignal<'model' | 'map' | 'pictures'> = signal('model'); 

  setActiveView(view: 'model' | 'map' | 'pictures') {
    this.activeView.set(view);
  }

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

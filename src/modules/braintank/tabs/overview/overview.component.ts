import { Component, signal, WritableSignal } from '@angular/core';
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
import { TranslateDirective } from '@ngx-translate/core';
import { ModelViewComponent } from "../../model-view/model-view.component";
import dayjs, { Dayjs } from 'dayjs';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData } from 'chart.js';
import { MapComponent, LayerComponent, GeoJSONSourceComponent } from "@maplibre/ngx-maplibre-gl";
import { StyleSpecification } from 'maplibre-gl';
import colorful from "../../../../assets/map/styles/colorful.json";


@Component({
  selector: 'braintank-overview',
  imports: [
    ModelViewComponent,
    TranslateDirective,
    NgIconComponent,
    BaseChartDirective,
    MapComponent,
    LayerComponent,
    GeoJSONSourceComponent
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
  waterLevel : WritableSignal<number> = signal(30);
  time : WritableSignal<Dayjs> = signal(dayjs());
  roofSize : WritableSignal<number> = signal(160);
  lat : WritableSignal<number> = signal(53.146);
  long : WritableSignal<number> = signal(8.185);
  draining : WritableSignal<boolean> = signal(true);
  drainingTime: WritableSignal<Dayjs> = signal(dayjs().subtract(30, 'minutes'));

  dataTest: ChartData<'line', {x: string, y: number}[]> = {
    datasets: [{
      data: [{x: '6:00', y: 20}, {x: '8:00', y: 12}, {x: '10:00', y: 7}, {x: '12:00', y: 0}, {x: '14:00', y: 10}, {x: '16:00', y: 7}],
      parsing: {
        xAxisKey: 'x',
        yAxisKey: 'y'
      }
    }],
  };

  protected activeView = signal<'model' | 'map' | 'pictures'>('model'); 

  setActiveView(view: 'model' | 'map' | 'pictures') {
    this.activeView.set(view);
  }

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

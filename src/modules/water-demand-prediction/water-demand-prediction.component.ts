import { Component, OnInit, ViewChild } from '@angular/core';
import { ChartConfiguration, ChartData, ChartDataset, ChartType, Plugin } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { WaterDemandPredictionService } from '../../api/water-demand-prediction.service';
import { Observable } from 'rxjs';
import { SingleSmartmeter, KindOfSmartmeter } from './water-demand-prediction.interface';
import { DropdownmenuComponent } from '../../common/dropdownmenu/dropdownmenu.component';

@Component({
  selector: 'water-demand-prediction',
  imports: [BaseChartDirective, DropdownmenuComponent],
  templateUrl: './water-demand-prediction.component.html',
  styles: ``
})
export class WaterDemandPredictionComponent implements OnInit {

  menuSmartmeter = "Select Smartmeter";
  optionsSmartmeter: Record<string, string> = {};
  choiceSmartmeter?: string;

  menuTime = "Select Timeframe";
  optionsTime: Record<string, string> = {
    "one day": "water-demand-prediction.timeframe.one-day", 
    "one week": "water-demand-prediction.timeframe.one-week", 
    "one month": "water-demand-prediction.timeframe.one-month", 
    "three months": "water-demand-prediction.timeframe.three-months",
    "six months": "water-demand-prediction.timeframe.six-months", 
    "one year": "water-demand-prediction.timeframe.one-year",
    "all": "water-demand-prediction.timeframe.all"
  };
  choiceTime?: string;

  menuResolution = "Select Resolution";
  optionsResolution: Record<string, string> = {
    "hourly": "water-demand-prediction.resolution.hourly",
    "daily": "water-demand-prediction.resolution.daily",
    "weekly": "water-demand-prediction.resolution.weekly"
  };
  choiceResolution?: string;

  allSingleFetchData: Record<string,SingleSmartmeter> = {}

  /**
   * The chart object, referenced from the html template
   */
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  /**
   * data skeleton for the line graph
   */
  chartData: ChartData = {
    labels: [], // X-axis labels
    datasets: [], // data points
  };

  /**
   * type of graph to use in chart
   */
  chartType: ChartType = 'line';

  /**
   * options used for the line chart to visualize prediction values
   */
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        stacked: false,
        title: {
          display: true,
          text: "m^3"
        },
        grid: {
          display: true, // Show grid lines on the y-axis
          color: '#000000', // Customize the grid line color '#e0e0e0'
          lineWidth: 0.2, // Set the width of the grid lines
        },
      },
      x: {
        title: {
          display: true,
          text: "Time"
        },
        grid: {
          display: false, // Show grid lines on the y-axis
          color: '#000000', // Customize the grid line color
          lineWidth: 0.2, // Set the width of the grid lines
        },
      }
    },
  };

   /**
   * color of the ng2chart
   */
   chartColor: string = '#ffffff';

   backgroundPlugin: Plugin<'bar'> = {
    id: 'custom_canvas_background_color',
    beforeDraw: (chart) => {
      const ctx = chart.ctx;
      ctx.save();
      ctx.fillStyle = this.chartColor; // Set the background color to white
      ctx.fillRect(0, 0, chart.width, chart.height);
      ctx.restore();
    }
  };

  chartPlugins = [this.backgroundPlugin];

  

  constructor(public waterDemandService: WaterDemandPredictionService) { }

  ngOnInit() {
      
    this.fetchMeterInformation();

  }

  /**
   * add all graphs to the chart. graphs are filtered based on 
   * their resolution to only display uniform graphs.
   * @param resolution hourly, weekly, daily
   */
addGraphsToChart(resolution: string): void {

  this.resetChart();

  let data: Record<string, SingleSmartmeter> = Object.keys(this.allSingleFetchData)
  .filter(key => this.allSingleFetchData[key].resolution === resolution)
  .reduce((acc, key) => {acc[key] = this.allSingleFetchData[key];
    return acc;
  }, {} as Record<string, SingleSmartmeter>);

  Object.keys(data).forEach((key) => {
    // Create a new dataset
    const newDataset: ChartDataset<'line'> = {
      label: this.allSingleFetchData[key].name,
      data: this.allSingleFetchData[key].numValue,
      borderColor: this.generateRandomColor(),
      fill: false,
    };

    this.chartData.labels = this.allSingleFetchData[key].dateObserved;
    this.chartData.datasets.push(newDataset);

    // Update the chart to reflect the changes
    if (!this.chart) {
      console.log("No chart initialized!");
      return
    }
    this.chart.update();

  })
}

/**
 * generate a random color from the color wheel
 * @returns random color code as string
 */
generateRandomColor(): string {
  const r = Math.floor(Math.random() * 256); // Random red value (0-255)
  const g = Math.floor(Math.random() * 256); // Random green value (0-255)
  const b = Math.floor(Math.random() * 256); // Random blue value (0-255)

  return `rgb(${r}, ${g}, ${b})`; // Return the color in rgb() format
}

/**
 * fetches all smartmeter names
 */
fetchMeterInformation(): void {
  this.waterDemandService.fetchMeterInformation().subscribe({
    next: (response: KindOfSmartmeter) => {
      this.optionsSmartmeter = Object.fromEntries(response.data.map(item => [item, item]))
    },
    error: (error) => {
      console.log(error);
    },
    complete: () => {

    }
  });
  
}

/**
 * generic method which inputs a function of a service to operate
 * @param extractionMethod the function in the corresponding service to use
 * @param responseField structure of the expected answer
 * @param destinationField name of parameter to extract from response
 */
extractData(extractionMethod: () => Observable<any>, destinationField: keyof this): void {
  extractionMethod().subscribe({
    next: (response) => {
      // Dynamically assign the response field to the destination field
      this[destinationField] = response;
    },
    error: (error) => {
      console.log(error);
    },
    complete: () => {

    }
  });
}

fetchSingleSmartmeter(): void {
  if(!this.choiceSmartmeter) {
    console.log("no choice  yet");
    return
  }

  if(!this.choiceTime) {
    console.log("no timeframe given");
    return
  }

  if(!this.choiceResolution) {
    console.log("no resolution chosen");
    return
  }

  this.waterDemandService.fetchSingleSmartmeter(this.choiceSmartmeter, this.choiceTime, this.choiceResolution).subscribe({
    next: (response: SingleSmartmeter) => {
      // add response info to the Record with name as key
      this.allSingleFetchData[response.name] = response;
      this.addGraphsToChart(response.resolution);
    },
    error: (error) => {
      console.log(error);
    },
    complete: () => {

    }
  });
}

resetChart(): void {
  if(!this.chart) {
    console.log("No Chart to alter")
  }

  if(!this.chartData) {
    console.log("Cannot reset empty data");
  }
  
  this.chartData.datasets = [];
  this.chartData.labels = [];
  this.chart?.update();
  console.log("Delete all requested Datasets");

}

}


import { Component, OnInit, ViewChild } from '@angular/core';
import { ChartConfiguration, ChartData, ChartDataset, ChartType, Plugin } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { WaterDemandPredictionService } from '../../api/water-demand-prediction.service';
import { Observable } from 'rxjs';
import { SingleSmartmeter, KindOfSmartmeter } from './water-demand-prediction.interface';
import { DropdownmenuComponent } from '../../common/dropdownmenu/dropdownmenu.component';

@Component({
  selector: 'wisdom-water-demand-prediction',
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
    "one year": "water-demand-prediction.timeframe.one-year"
  };
  choiceTime?: string;

  singleFetchdata: SingleSmartmeter | undefined

  /**
   * The chart object, referenced from the html template
   */
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

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

  /**
   * standard xAxis labels for prediction values
   */
  standardLabels: string[] = ['01:00', '02:00', '03:00',
    '04:00', '05:00', '06:00', '07:00',
    '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00',
    '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00', '23:00']

  /**
   * data skeleton for the line graph
   */
  chartData: ChartData<'line'> = {
    labels: this.standardLabels, // X-axis labels
    datasets: [], // data points
  };

  constructor(public waterDemandService: WaterDemandPredictionService) { }

  ngOnInit() {
      
    this.fetchMeterInformation();
    this.fetchSingleSmartmeter();

  }

/**
 * uses the singleSmartmeter interface and expands the values into separate lists
 * which can be used in a chart
 */
createGraphFromSmartmeter(): void {
  let labels: string[] = [];
  let nums: number[] = [];

  if (this.singleFetchdata) {
    this.singleFetchdata.dateObserved.forEach((value) => {
      labels.push(value);
    });
    this.singleFetchdata.numValue.forEach((value) => {
      nums.push(value);
    })

    this.chartData.labels = labels;
    this.addGraphToChart(nums, this.singleFetchdata.name)
  }
}

/**
   * Function to add new lines dynamically to the graph
   * @param label new data label
   * @param dataPoints the new prediction values
   * @param borderColor color to use
   */
addGraphToChart(dataPoints: number[], label: string): void {

  // Create a new dataset
  const newDataset: ChartDataset<'line'> = {
    label: label,
    data: dataPoints,
    borderColor: this.generateRandomColor(),
    fill: false,
  };

  // Add the new dataset to the existing chart data
  this.chartData.datasets.push(newDataset);

  console.log(this.chartData.datasets[0].label)

  this.chartData.datasets.forEach(() => {
  })


  // Update the chart to reflect the changes
  if (this.chart) {
    this.chart.update();
  }
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

  // BUG: Change parameter to be extracted from dropdown!
  this.waterDemandService.fetchSingleSmartmeter(this.choiceSmartmeter, this.choiceTime).subscribe({
    next: (response) => {
      this.singleFetchdata = response
    },
    error: (error) => {
      console.log(error);
    },
    complete: () => {
      this.createGraphFromSmartmeter();
    }
  });
}

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
}

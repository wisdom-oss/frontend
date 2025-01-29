import {ViewChildren, Component, OnInit, QueryList} from "@angular/core";
import {ChartConfiguration, ChartData, ChartDataset, ChartType} from "chart.js";
import {BaseChartDirective} from "ng2-charts";
import {Observable} from "rxjs";

import {SingleSmartmeter} from "./water-demand-prediction.interface";
import {WaterDemandPredictionService} from "../../api/water-demand-prediction.service";
import {DropdownComponent} from "../../common/components/dropdown/dropdown.component";

@Component({
  selector: "water-demand-prediction",
  imports: [BaseChartDirective, DropdownComponent],
  templateUrl: "./water-demand-prediction.component.html",
  styles: ``,
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
    all: "water-demand-prediction.timeframe.all",
  };
  choiceTime?: string;

  menuResolution = "Select Resolution";
  optionsResolution: Record<string, string> = {
    hourly: "water-demand-prediction.resolution.hourly",
    daily: "water-demand-prediction.resolution.daily",
    weekly: "water-demand-prediction.resolution.weekly",
  };
  choiceResolution?: string;

  /** saves all requested data by resolution */
  dataPerResolution: Record<string, SingleSmartmeter[]> = {};

  /**
   * The chart object, referenced from the html template.
   * ViewChildren is a list of charts, because when using ViewChild,
   * only ever the first chart gets updated at all.
   */
  @ViewChildren(BaseChartDirective) charts:
    | QueryList<BaseChartDirective>
    | undefined;

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
  chartType: ChartType = "line";

  /**
   * options used for the line chart to visualize prediction values
   */
  chartOptions: ChartConfiguration["options"] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        stacked: false,
        title: {
          display: true,
          text: "m^3",
        },
        grid: {
          display: true, // Show grid lines on the y-axis
          color: "#000000", // Customize the grid line color '#e0e0e0'
          lineWidth: 0.4, // Set the width of the grid lines
        },
      },
      x: {
        title: {
          display: true,
          text: "Time",
        },
        grid: {
          display: false, // Show grid lines on the y-axis
          color: "#000000", // Customize the grid line color #000000
          lineWidth: 0.4, // Set the width of the grid lines
        },
      },
    },
  };

  constructor(public waterDemandService: WaterDemandPredictionService) {}

  ngOnInit() {
    this.fetchMeterInformation();
  }

  /**
   * shows all graphs based on the selected resolution
   * @param resolution choice of hourly, daily, weekly
   */
  showGraphs(resolution: string): void {
    // reset data to begin
    this.chartData.labels = [];
    this.chartData.datasets = [];

    this.dataPerResolution[resolution].forEach(entry => {
      let newDataset = this.createNewDataset(entry.name, entry.numValue);
      this.chartData.datasets.push(newDataset);
      this.chartData.labels = entry.dateObserved;
    });

    this.updateCharts();
  }

  /**
   * create a new dataset for chartjs from the given data
   * @param label label of the chartdata
   * @param data data points
   * @returns new dataset
   */
  createNewDataset(label: string, data: number[]): ChartDataset {
    const newDataset: ChartDataset<"line"> = {
      label: label,
      data: data,
      borderColor: this.generateRandomColor(),
      fill: false,
    };
    return newDataset;
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
      next: response => {
        this.optionsSmartmeter = response;
      },
      error: error => {
        console.log(error);
      },
      complete: () => {},
    });
  }

  /**
   * generic method which inputs a function of a service to operate
   * @param extractionMethod the function in the corresponding service to use
   * @param responseField structure of the expected answer
   * @param destinationField name of parameter to extract from response
   */
  extractData(
    extractionMethod: () => Observable<any>,
    destinationField: keyof this,
  ): void {
    extractionMethod().subscribe({
      next: response => {
        // Dynamically assign the response field to the destination field
        this[destinationField] = response;
      },
      error: error => {
        console.log(error);
      },
      complete: () => {},
    });
  }

  /**
   * fetches data of a single smartmeter and saves it into the record
   * checks if any substantial part of the api request is faulty
   * @returns when any variable is missing.
   */
  fetchSingleSmartmeter(): void {
    if (!this.choiceResolution) {
      console.log("no resolution chosen");
      return;
    }

    if (!this.choiceTime) {
      console.log("no timeframe given");
      return;
    }

    if (!this.choiceSmartmeter) {
      console.log("no smartmeter chosen");
      return;
    }

    if (
      !this.preventDoublingData(
        this.choiceResolution,
        this.choiceTime,
        this.choiceSmartmeter,
      )
    ) {
      console.log("Data already requested. API Request cancelled.");
      return;
    }

    this.waterDemandService
      .fetchSingleSmartmeter(
        this.choiceSmartmeter,
        this.choiceTime,
        this.choiceResolution,
      )
      .subscribe({
        next: (response: SingleSmartmeter) => {
          // create new key of resolution and save smartmeter data to it
          if (response.resolution in this.dataPerResolution) {
            this.dataPerResolution[response.resolution].push(response);
            // use existing key and push smartmeter data in it
          } else {
            this.dataPerResolution[response.resolution] = [response];
          }
        },
        error: error => {
          console.log(error);
        },
        complete: () => {
          console.log(this.dataPerResolution);
        },
      });
  }

  /** checks if data was already requested
   * false if data is already requested
   * true if request should be made
   */
  preventDoublingData(
    resolution: string,
    timeframe: string,
    name: string,
  ): boolean {
    // Check if record is empty or key is not yet registered.
    if (!this.dataPerResolution || !this.dataPerResolution[resolution]) {
      return true;
    }
    for (const item of this.dataPerResolution[resolution]) {
      if (item.name === name && item.timeframe === timeframe) {
        return false;
      }
    }
    console.log("Data validated, start API request");
    return true;
  }

  /**
   * update all charts in ViewChildren
   * @returns if there is no chart
   */
  updateCharts(): void {
    if (!this.charts) {
      console.log("No chart initialized!");
      return;
    }

    this.charts.forEach(child => {
      if (!child.chart) {
        console.log("No chart in charts!");
        return;
      }
      child.chart.update();
    });
  }

  resetChart(): void {
    this.chartData.labels = [];
    this.chartData.datasets = [];
    this.dataPerResolution = {};
    this.updateCharts();
  }
}

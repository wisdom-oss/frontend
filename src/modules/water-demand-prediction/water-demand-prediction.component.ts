import {ViewChildren, Component, OnInit, QueryList} from "@angular/core";
import {
  ChartConfiguration,
  ChartData,
  ChartDataset,
  ChartType,
} from "chart.js";
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

  fetchedData: SingleSmartmeter[] = [];

  allSingleFetchData: Record<string, SingleSmartmeter> = {};

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
   * Checks if data to request is already fetched and ignores the call in that case
   * returns true if no double request is taken
   */
  checkForDoubleEntry(): boolean {

    console.log(this.fetchedData);

    this.fetchedData.forEach(entry => {

      console.log(this.choiceSmartmeter);
      console.log(entry.name);


      if (this.choiceSmartmeter == entry.name && this.choiceResolution == entry.resolution && this.choiceTime == entry.timeframe) {
        console.log("duplicate parameters found, not adding current one");
        return false;
      }
      return;
    });

    return true;
    
  }

  showCorrectGraphs(timeframe: string, resolution: string): void {
    this.fetchedData.forEach(item => {
      if ((item.resolution != resolution) || item.timeframe != timeframe) {
        return;
      }

      this.displayGraph(item);

    })
  }

  displayGraph(chartInfos: SingleSmartmeter): void {

    let newDataset = this.createNewDataset(chartInfos.name, chartInfos.numValue);
    this.chartData.labels = chartInfos.dateObserved;
    this.chartData.datasets.push(newDataset);
    this.updateCharts();

  }

  createNewDataset(label: string, data: number[]): ChartDataset {
    const newDataset: ChartDataset<"line"> = {
      label: label,
      data: data,
      borderColor: this.generateRandomColor(),
      fill: false,
    };
    return newDataset;
  }

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
        console.log(this.optionsSmartmeter);
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

  fetchSingleSmartmeter(): void {
    if (!this.choiceSmartmeter) {
      console.log("no smartmeter chosen");
      return;
    }

    if (!this.choiceTime) {
      console.log("no timeframe given");
      return;
    }

    if (!this.choiceResolution) {
      console.log("no resolution chosen");
      return;
    }

    let t = this.checkForDoubleEntry();
    // CONTINUE HERE; DATASETS ARE BEING DUPLICATED

    if(!this.checkForDoubleEntry()) {
      console.log("Data already requested");
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
          this.fetchedData.push(response);
          this.showCorrectGraphs(response.timeframe, response.resolution);
          // add response info to the Record with name as key
          //this.allSingleFetchData[response.name] = response;
          //this.addGraphsToChart(response.resolution);
        },
        error: error => {
          console.log(error);
        },
        complete: () => {},
      });
  }

  resetChart(): void {
    this.chartData.labels = [];
    this.chartData.datasets = [];
    this.fetchedData = [];
    //this.allSingleFetchData = {};
    this.updateCharts();
  }

  
  /**
   * add all graphs to the chart. graphs are filtered based on
   * their resolution to only display uniform graphs.
   * @param resolution hourly, weekly, daily
   */
  addGraphsToChart(resolution: string): void {
    this.resetChart();

    let data: Record<string, SingleSmartmeter> = Object.keys(
      this.allSingleFetchData,
    )
      .filter(key => this.allSingleFetchData[key].resolution === resolution)
      .reduce(
        (acc, key) => {
          acc[key] = this.allSingleFetchData[key];
          return acc;
        },
        {} as Record<string, SingleSmartmeter>,
      );

    Object.keys(data).forEach(key => {
      // Create a new dataset
      const newDataset: ChartDataset<"line"> = {
        label: this.allSingleFetchData[key].name,
        data: this.allSingleFetchData[key].numValue,
        borderColor: this.generateRandomColor(),
        fill: false,
      };

      this.chartData.labels = this.allSingleFetchData[key].dateObserved;
      this.chartData.datasets.push(newDataset);

      this.updateCharts();
    });
  }


}

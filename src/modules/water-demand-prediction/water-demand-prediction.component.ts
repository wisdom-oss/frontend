import {ViewChildren, Component, OnInit, QueryList} from "@angular/core";
import {ChartConfiguration, ChartData, ChartDataset, ChartType} from "chart.js";
import {BaseChartDirective} from "ng2-charts";
import {SingleSmartmeter, PredictionSingleSmartmeter} from "./water-demand-prediction.interface";
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
    "all": "water-demand-prediction.timeframe.all",
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

  /** saves all predicted values by resolution */
  predPerResolution: Record<string, PredictionSingleSmartmeter[]> = {};

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
  chartDataCurrentValues: ChartData = {
    labels: [], // X-axis labels
    datasets: [], // data points
  };

  /**
   * data skeleton for the line graph
   */
  chartDataPredictedValues: ChartData = {
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
    elements: {
      line: {
        tension: 0.4, // Smooth curve
      },
    },
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
    this.chartDataCurrentValues.labels = [];
    this.chartDataCurrentValues.datasets = [];

    this.dataPerResolution[resolution].forEach(entry => {
      let newDataset = this.createNewDataset(entry.name, entry.numValue, false);
      this.chartDataCurrentValues.datasets.push(newDataset);
      this.chartDataCurrentValues.labels = entry.dateObserved;
    });

    this.updateCharts(0);
  }

  /**
   * shows all graphs based on the selected resolution
   * @param resolution choice of hourly, daily, weekly
   */
  showPredictionGraphs(resolution: string): void {
    // reset data to begin
    this.chartDataPredictedValues.labels = [];
    this.chartDataPredictedValues.datasets = [];

    this.predPerResolution[resolution].forEach(entry => {
      this.chartDataPredictedValues.labels = entry.dateObserved;

      let predData = this.createNewDataset(entry.name, entry.numValue, false);
      this.chartDataPredictedValues.datasets.push(predData);

      let lower_conf_int = this.createNewDataset("lower_confidence_interval", entry.lower_conf_values, 0);
      this.chartDataPredictedValues.datasets.push(lower_conf_int);

      let upper_conf_int = this.createNewDataset("upper_confidence_interval", entry.upper_conf_values, 0);
      this.chartDataPredictedValues.datasets.push(upper_conf_int);

    });

    this.updateCharts(1);
  }

  /**
   * create a new dataset for chartjs from the given data
   * @param label label of the chartdata
   * @param data data points
   * @param fillOption: false, 0 for confidence interval
   * @returns new dataset
   */
  createNewDataset(label: string, data: number[], fillOption: any): ChartDataset {
    let color = "transparent";

    // to display confidence intervalls 
    if (fillOption === false) {
      color = this.generateRandomColor();
    }

    const newDataset: ChartDataset<"line"> = {
      label: label,
      data: data,
      borderColor: color,
      fill: fillOption,
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
   * fetches data of a single smartmeter and saves it into the record
   * checks if any substantial part of the api request is faulty
   * @returns when any variable is missing.
   */
  fetchSingleSmartmeter(): void {
    if (!this.checkForDefinedRequestParameters()) {
      return;
    }

    if (!this.checkForUniqueData(this.choiceResolution!,
      this.choiceTime!,
      this.choiceSmartmeter!,
      this.dataPerResolution)) {
      return;
    }

    this.waterDemandService
      .fetchSingleSmartmeter(
        this.choiceSmartmeter!,
        this.choiceTime!,
        this.choiceResolution!,
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

        },
      });
  }

  fetchPredSingleSmartmeter(): void {
    if (!this.checkForDefinedRequestParameters()) {
      return;
    }

    if (!this.checkForUniqueData(this.choiceResolution!,
      this.choiceTime!,
      this.choiceSmartmeter!,
      this.predPerResolution)) {
      return;
    }

    console.log("Start fetching predicted Values. Please wait.")

    this.waterDemandService
      .fetchSinglePredictionSmartmeter(
        this.choiceSmartmeter!,
        this.choiceTime!,
        this.choiceResolution!,
      )
      .subscribe({
        next: (response: PredictionSingleSmartmeter) => {
          // create new key of resolution and save smartmeter data to it
          if (response.resolution in this.predPerResolution) {
            this.predPerResolution[response.resolution].push(response);
            // use existing key and push smartmeter data in it
          } else {
            this.predPerResolution[response.resolution] = [response];
          }
        },
        error: error => {
          console.log(error);
        },
        complete: () => {
          console.log(this.predPerResolution);
          console.log("Finalized prediction request.")
        },
      });
  }

  /** check for undefined parameters. True when every parameter is defined, else false*/
  checkForDefinedRequestParameters(): boolean {
    if (!this.choiceResolution) {
      console.error("no resolution chosen");
      return false;
    }

    if (!this.choiceTime) {
      console.error("no timeframe given");
      return false;
    }

    if (!this.choiceSmartmeter) {
      console.error("no smartmeter chosen");
      return false;
    }

    return true;

  }

  /** check if the requested dataset would be unique or not. True if unique, else false */
  checkForUniqueData(resolution: string,
    timeframe: string,
    name: string,
    usedRecord: any): boolean {

    // if neither record or resolution is already present, data request must be unique
    if (!usedRecord || !usedRecord[resolution]) {
      return true;
    }

    // when name of record and timeframe are equal, datasets are the same data. 
    for (let item of usedRecord[resolution]) {
      if (name === item.name && timeframe === item.timeframe) {
        (console.log(name + ": " + timeframe + " already exist in resolution of: " + resolution ))
        return false;
      }
    }

    return true;    
  }

  /**
   * update all charts in ViewChildren
   * update only one chart based on index given, when given one.
   * @returns if there is no chart
   */
  updateCharts(indexOfChart?: number): void {
    if (!this.charts) {
      console.log("No chart initialized!");
      return;
    }

    // add 1 to update the first graph, add 2 to update the prediction graph only
    if(indexOfChart) {
      this.charts.toArray()[indexOfChart].update();
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

  /** Completely erases data from the graph elements */
  resetChart(): void {
    this.chartDataCurrentValues.labels = [];
    this.chartDataCurrentValues.datasets = [];

    this.chartDataPredictedValues.labels = [];
    this.chartDataPredictedValues.datasets = [];
    
    this.dataPerResolution = {};
    this.predPerResolution = {};
    this.updateCharts();
  }
  
}

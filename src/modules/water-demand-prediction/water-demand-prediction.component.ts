import {
  signal,
  ViewChildren,
  Component,
  OnInit,
  QueryList,
} from "@angular/core";
import {TranslatePipe} from "@ngx-translate/core";
import {ChartConfiguration, ChartData, ChartDataset, ChartType} from "chart.js";
import {BaseChartDirective} from "ng2-charts";

import {
  PredictedSmartmeterDataset,
  SmartmeterDataset,
  PredictionSingleSmartmeter,
  SingleSmartmeter,
} from "./water-demand-prediction.interface";
import {WaterDemandPredictionService} from "../../api/water-demand-prediction.service";
import {DropdownComponent} from "../../common/components/dropdown/dropdown.component";

@Component({
  selector: "water-demand-prediction",
  imports: [BaseChartDirective, DropdownComponent, TranslatePipe],
  templateUrl: "./water-demand-prediction.component.html",
  styles: ``,
})
export class WaterDemandPredictionComponent implements OnInit {
  /** the displayed resolution in the charts of real data */
  displayedResolution = signal<string>("hourly");

  /** variables name dropdown */
  menuSmartmeter = "Select Smartmeter";
  optionsSmartmeter: Record<string, string> = {};
  choiceSmartmeter = signal<string>("urn:ngsi-ld:Device:atypical-household");

  /** variables timeframe dropdown */
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
  choiceTime = signal<string>("one week");

  /** variables resolution dropdown */
  menuResolution = "Select Resolution";
  optionsResolution: Record<string, string> = {
    hourly: "water-demand-prediction.resolution.hourly",
    daily: "water-demand-prediction.resolution.daily",
    weekly: "water-demand-prediction.resolution.weekly",
  };
  choiceResolution = signal<string>("hourly");

  /** data object of current requested Smartmeterdata */
  currentSmartmeterData?: SingleSmartmeter;

  /** data object of current requested Smartmeterdata */
  currentPredictedSmartmeterData?: PredictionSingleSmartmeter;

  /** Record to hold all saved ChartDatasets */
  savedDatasets: Record<string, SmartmeterDataset[]> = {};

  /** Record to hold all saved predicted ChartDatasets */
  predictedDatasets: Record<string, PredictedSmartmeterDataset[]> = {};

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
   * as a signal to change it via template
   */
  chartType = signal<ChartType>("bar");

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

  /**
   * The chart object, referenced from the html template.
   * ViewChildren is a list of charts, because when using ViewChild,
   * only ever the first chart gets updated at all.
   */
  @ViewChildren(BaseChartDirective) charts:
    | QueryList<BaseChartDirective>
    | undefined;

  constructor(public waterDemandService: WaterDemandPredictionService) {}

  ngOnInit() {
    this.fetchMeterInformation();
    this.fetchDataSmartmeter();
  }

  /** set the displayed resolution and update the chart to mirror that */
  setDisplayedResolution(resolution: string): void {
    this.displayedResolution.set(resolution);
  }

  /** set the displayed chartType to change from line to bar and back */
  switchDisplayedChartType(): void {
    if (this.chartType() === "line") {
      this.chartType.set("bar");
    } else {
      this.chartType.set("line");
    }
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
    if (indexOfChart) {
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

  /** Completely erases data from the real data graph element */
  resetChart(): void {
    this.chartDataCurrentValues.labels = [];
    this.chartDataCurrentValues.datasets = [];

    this.savedDatasets = {};
    this.updateCharts();
  }

  /** Completely erases data from predicted graph element */
  resetPredictionChart(): void {
    this.chartDataPredictedValues.labels = [];
    this.chartDataPredictedValues.datasets = [];

    this.predictedDatasets = {};
    this.updateCharts();
  }

  /** helper function to create a color from values */
  createColorFromParameter(
    label: string,
    resolution: string,
    timeframe: string,
  ): string {
    return this.stringToColor(label + resolution + timeframe);
  }

  /**
   * Generates deterministically a hex color code from any string.
   *
   * This is a modernized version of this
   * [StackOverflow reply](https://stackoverflow.com/a/16348977/15800714).
   * @param str A string to generate a hex color for
   * @param map A color map for predefined strings
   *
   * @returns A hex color code in the style of '#abc123'
   */
  stringToColor(str: string, map?: Record<string, string>): string {
    if (map && map[str]) {
      return map[str];
    }
    let hash = 0;
    for (let s of str) {
      hash = s.charCodeAt(0) + ((hash << 5) - hash);
    }
    let color = "#";
    for (let i = 0; i < 3; i++) {
      let value = (hash >> (i * 8)) & 0xff;
      color += ("00" + value.toString(16)).slice(-2);
    }
    console.log(color);
    return color;
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

  /** true if choices are already present, false if unique */
  checkDoubleParameters(
    nameSmartmeter: string,
    timeframe: string,
    resolution: string,
  ): boolean {
    if (!this.savedDatasets[resolution]) {
      return true;
    }

    /** the color is based on 3 unique parameters, thus, when color is equal, the set is already present */
    let colorToCheck = this.createColorFromParameter(
      nameSmartmeter,
      resolution,
      timeframe,
    );

    for (let entry of this.savedDatasets[resolution]) {
      if (entry.dataset.borderColor === colorToCheck) {
        return false;
      }
    }

    return true;
  }

  checkDoublePredictedParameters(
    nameSmartmeter: string,
    timeframe: string,
    resolution: string,
  ): boolean {
    if (!this.predictedDatasets[resolution]) {
      return true;
    }

    /** the color is based on 3 unique parameters, thus, when color is equal, the set is already present */
    let colorToCheck = this.createColorFromParameter(
      nameSmartmeter,
      resolution,
      timeframe,
    );

    for (let entry of this.predictedDatasets[resolution]) {
      if (entry.dataset.borderColor === colorToCheck) {
        return false;
      }
    }

    return true;
  }

  /**
   * create a new dataset for chartjs from the given data
   * @param label label of the chartdata
   * @param data data points
   * @param fillOption: false, 0 for confidence interval
   * @returns new dataset
   */
  createNewDataset(
    data: number[],
    label: string,
    resolution: string,
    timeframe: string,
    fillOption: any,
    type: string,
  ): ChartDataset {
    let color = "#D3D3D3"; // light grey

    // to display confidence intervalls
    if (fillOption === false) {
      color = this.createColorFromParameter(label, resolution, timeframe);
    }

    const newDataset: ChartDataset<"line"> = {
      label: label,
      data: data,
      borderColor: color,
      backgroundColor: color,
      fill: fillOption,
    };
    return newDataset;
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
        console.error(error);
      },
      complete: () => {},
    });
  }

  /**
   * function to fetch data by parameters provided
   * doesnt request data when data is already requested before
   * creates new ChartDatasets and activates the display function
   * @returns nothing
   */
  fetchDataSmartmeter(): void {
    /** check if any selection is missing for request */
    if (!this.checkForDefinedRequestParameters()) {
      return;
    }

    /** checks if parameters are already requested and prevents request if so. */
    if (
      !this.checkDoubleParameters(
        this.choiceSmartmeter(),
        this.choiceTime(),
        this.choiceResolution(),
      )
    ) {
      console.log(
        "combination of" +
          this.choiceSmartmeter +
          " " +
          this.choiceTime +
          " \n " +
          this.choiceResolution +
          " already requested",
      );
      return;
    }

    this.waterDemandService
      .fetchSingleSmartmeter(
        this.choiceSmartmeter(),
        this.choiceTime(),
        this.choiceResolution(),
      )
      .subscribe({
        next: (response: SingleSmartmeter) => {
          this.currentSmartmeterData = response;
        },
        error: error => {
          console.log(error);
        },
        complete: () => {
          let newDataset = this.createNewDataset(
            this.currentSmartmeterData?.numValue!,
            this.currentSmartmeterData?.name!,
            this.currentSmartmeterData?.resolution!,
            this.currentSmartmeterData?.timeframe!,
            false,
            this.chartType(),
          );
          let smartmeterdata: SmartmeterDataset = {
            dataset: newDataset,
            labels: this.currentSmartmeterData?.dateObserved!,
          };

          if (!this.savedDatasets[this.currentSmartmeterData?.resolution!]) {
            this.savedDatasets[this.currentSmartmeterData?.resolution!] = [];
          }

          this.savedDatasets[this.currentSmartmeterData?.resolution!].push(
            smartmeterdata,
          );

          this.setDisplayedResolution(this.currentSmartmeterData?.resolution!);
          this.showDatasets(this.currentSmartmeterData?.resolution!);
          this.currentSmartmeterData = undefined;
        },
      });
  }

  /**
   * fetches the prediction data of a given set of choices.
   */
  fetchPredDataSmartmeter(): void {
    /** check if any selection is missing for request */
    if (!this.checkForDefinedRequestParameters()) {
      return;
    }

    /** checks if parameters are already requested and prevents request if so. */
    if (
      !this.checkDoublePredictedParameters(
        this.choiceSmartmeter(),
        this.choiceTime(),
        this.choiceResolution(),
      )
    ) {
      console.log(
        "combination of" +
          this.choiceSmartmeter +
          " " +
          this.choiceTime +
          " \n " +
          this.choiceResolution +
          " already requested",
      );
      return;
    }

    alert("Start requesting prediction values. Please wait.");

    this.waterDemandService
      .fetchSinglePredictionSmartmeter(
        this.choiceSmartmeter(),
        this.choiceTime(),
        this.choiceResolution(),
      )
      .subscribe({
        next: (response: PredictionSingleSmartmeter) => {
          this.currentPredictedSmartmeterData = response;
        },
        error: error => {
          console.log(error);
        },
        complete: () => {
          alert("Finished requesting prediction values. Please continue.");

          let newDataset = this.createNewDataset(
            this.currentPredictedSmartmeterData?.numValue!,
            this.currentPredictedSmartmeterData?.name!,
            this.currentPredictedSmartmeterData?.resolution!,
            this.currentPredictedSmartmeterData?.timeframe!,
            false,
            this.chartType(),
          );

          let lower_conf_int = this.createNewDataset(
            this.currentPredictedSmartmeterData?.lower_conf_values!,
            "lower_confidence_interval",
            this.currentPredictedSmartmeterData?.resolution!,
            this.currentPredictedSmartmeterData?.timeframe!,
            0,
            this.chartType(),
          );

          let upper_conf_int = this.createNewDataset(
            this.currentPredictedSmartmeterData?.upper_conf_values!,
            "upper_confidence_interval",
            this.currentPredictedSmartmeterData?.resolution!,
            this.currentPredictedSmartmeterData?.timeframe!,
            0,
            this.chartType(),
          );

          let smartmeterdata: PredictedSmartmeterDataset = {
            upper_conf_interval_dataset: upper_conf_int,
            dataset: newDataset,
            lower_conf_interval_dataset: lower_conf_int,
            labels: this.currentPredictedSmartmeterData?.dateObserved!,
          };

          console.log(smartmeterdata);

          if (
            !this.predictedDatasets[
              this.currentPredictedSmartmeterData?.resolution!
            ]
          ) {
            this.predictedDatasets[
              this.currentPredictedSmartmeterData?.resolution!
            ] = [];
          }

          this.predictedDatasets[
            this.currentPredictedSmartmeterData?.resolution!
          ].push(smartmeterdata);

          this.setDisplayedResolution(
            this.currentPredictedSmartmeterData?.resolution!,
          );
          this.showPredictedDatasats(
            this.currentPredictedSmartmeterData?.resolution!,
          );
          this.currentPredictedSmartmeterData = undefined;
        },
      });
  }

  /** show datasets based on the resolution chosen */
  showDatasets(resolution: string): void {
    // reset data to begin
    this.chartDataCurrentValues.labels = [];
    this.chartDataCurrentValues.datasets = [];

    /** add relevant datasets based on resolution to chartData */
    this.savedDatasets[resolution].forEach(entry => {
      this.chartDataCurrentValues.datasets.push(entry.dataset);
      this.chartDataCurrentValues.labels = entry.labels;
    });

    /** update charts to display information */
    this.updateCharts(0);
  }

  showPredictedDatasats(resolution: string): void {
    // reset data to begin
    this.chartDataPredictedValues.labels = [];
    this.chartDataPredictedValues.datasets = [];

    /** add relevant datasets based on resolution to chartData */
    this.predictedDatasets[resolution].forEach(entry => {
      this.chartDataPredictedValues.datasets.push(entry.dataset);
      this.chartDataPredictedValues.datasets.push(
        entry.lower_conf_interval_dataset,
      );
      this.chartDataPredictedValues.datasets.push(
        entry.upper_conf_interval_dataset,
      );
      this.chartDataPredictedValues.labels = entry.labels;
    });

    /** update charts to display information */
    this.updateCharts(0);
  }
}

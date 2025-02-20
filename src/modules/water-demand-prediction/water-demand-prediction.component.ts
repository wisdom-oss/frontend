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

  currentSmartmeterData?: SingleSmartmeter;

  savedDatasets: Record<string, SmartmeterDataset[]> = {};

  /** the displayed resolution in the charts of real data */
  displayedResolution = signal<string>("hourly");

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

  /** set the displayed resolution and update the chart to mirror that */
  setDisplayedResolution(resolution: string): void {
    this.displayedResolution.set(resolution);

    this.showDatasets(resolution);
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

  /** Completely erases data from the graph elements */
  resetChart(): void {
    this.chartDataCurrentValues.labels = [];
    this.chartDataCurrentValues.datasets = [];

    this.savedDatasets = {};

    this.chartDataPredictedValues.labels = [];
    this.chartDataPredictedValues.datasets = [];

    this.predPerResolution = {};
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
  ): ChartDataset {
    let color = "transparent";

    // to display confidence intervalls
    if (fillOption === false) {
      color = this.createColorFromParameter(label, resolution, timeframe);
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
        this.choiceSmartmeter!,
        this.choiceTime!,
        this.choiceResolution!,
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
        this.choiceSmartmeter!,
        this.choiceTime!,
        this.choiceResolution!,
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

  /** CONTINUE HERE TO CHANGE */
  fetchPredSingleSmartmeter(): void {
    if (!this.checkForDefinedRequestParameters()) {
      return;
    }

    alert("Start fetching predicted Values. Please wait.");
    console.log("Start fetching predicted Values. Please wait.");

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
            let color = this.stringToColor(
              response.name + response.resolution + response.timeframe,
            );
            // add color and change interface
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
          console.log("Finalized prediction request.");
          alert("Finalized prediction request.");
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

      let predData = this.createNewDataset(
        entry.numValue,
        entry.name,
        resolution,
        entry.timeframe,
        false,
      );
      this.chartDataPredictedValues.datasets.push(predData);

      let lower_conf_int = this.createNewDataset(
        entry.lower_conf_values,
        "lower_confidence_interval",
        resolution,
        entry.timeframe,
        0,
      );
      this.chartDataPredictedValues.datasets.push(lower_conf_int);

      let upper_conf_int = this.createNewDataset(
        entry.upper_conf_values,
        "upper_confidence_interval",
        resolution,
        entry.timeframe,
        0,
      );
      this.chartDataPredictedValues.datasets.push(upper_conf_int);
    });

    this.updateCharts(1);
  }
}

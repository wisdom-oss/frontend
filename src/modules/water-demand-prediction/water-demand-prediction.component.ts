import {CommonModule} from "@angular/common";
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
  imports: [BaseChartDirective, DropdownComponent, TranslatePipe, CommonModule],
  templateUrl: "./water-demand-prediction.component.html",
  styles: ``,
})
export class WaterDemandPredictionComponent implements OnInit {
  /** the displayed resolution in the charts of real data */
  displayedResolution = signal<string>("hourly");

  /** variables startpoint dropdown */
  menuStartPoint = "water-demand-prediction.startpoint.menu";
  optionsStartPoint: Record<string, string> = {
    "2021-05-26T00:00:00": "water-demand-prediction.startpoint.options.a",
    "2021-06-01T00:00:00": "water-demand-prediction.startpoint.options.b",
    "2022-01-01T00:00:00": "water-demand-prediction.startpoint.options.c",
  };
  choiceStartPoint = signal<string>("2022-01-01T00:00:00");

  /** variables resolution dropdown */
  menuResolution = "water-demand-prediction.choice.resolution";
  optionsResolution: Record<string, string> = {
    hourly: "water-demand-prediction.resolution.hourly",
    daily: "water-demand-prediction.resolution.daily",
    weekly: "water-demand-prediction.resolution.weekly",
  };
  choiceResolution = signal<string>("hourly");

  /** variables timeframe dropdown */
  menuTime = "water-demand-prediction.choice.timeframe";
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

  /** variables name dropdown */
  menuSmartmeter = "water-demand-prediction.choice.smartmeter";
  optionsSmartmeter: Record<string, string> = {};
  choiceSmartmeter = signal<string>("urn:ngsi-ld:Device:retired-household");

  menuWeather = "water-demand-prediction.choice.weather";
  optionsWeather: Record<string, string> = {
    plain: "water-demand-prediction.weather.plain",
    air_temperature: "water-demand-prediction.weather.air_temperature",
    precipitation: "water-demand-prediction.weather.precipitation",
    moisture: "water-demand-prediction.weather.moisture",
  };
  choiceWeather = signal<string>("plain");

  /** data object of current requested Smartmeterdata */
  currentSmartmeterData?: SingleSmartmeter;

  /** data object of current requested Smartmeterdata */
  currentPredictedSmartmeterData = signal<PredictionSingleSmartmeter | null>(
    null,
  );

  /** Record to hold all saved ChartDatasets */
  savedDatasets: Record<string, SmartmeterDataset[]> = {};

  /** Record to hold all saved predicted ChartDatasets */
  predictedDatasets: Record<string, PredictedSmartmeterDataset[]> = {};

  /**allows multiple records over all charts if true */
  allowCheckMultiple = signal<boolean>(true);

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
  chartType = signal<ChartType>("line");

  /**
   * options used for the line chart to visualize prediction values
   */
  chartOptions: ChartConfiguration["options"] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: {
        tension: 0.1, // Smooth curve
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

  explainMAE: string =
    "In the context of machine learning, absolute error refers to the magnitude of difference between the prediction of an observation and the true value of that observation. MAE takes the average of absolute errors for a group of predictions and observations as a measurement of the magnitude of errors for the entire group. MAE can also be referred as L1 loss function.";
  explainRMSE: string =
    "Root mean square error or root mean square deviation is one of the most commonly used measures for evaluating the quality of predictions. It shows how far predictions fall from measured true values using Euclidean distance.";
  explainMSE: string =
    "In the fields of regression analysis and machine learning, the Mean Square Error (MSE) is a crucial metric for evaluating the performance of predictive models. It measures the average squared difference between the predicted and the actual target values within a dataset. The primary objective of the MSE is to assess the quality of a model's predictions by measuring how closely they align with the ground truth.";
  explainR2: string =
    "The R-squared metric — R², or the coefficient of determination – is used to measure how well a model fits data, and how well it can predict future outcomes. Simply put, it tells you how much of the variation in your data can be explained by your model. The closer the R-squared value is to one, the better your model fits the data.";

  constructor(public waterDemandService: WaterDemandPredictionService) {}

  ngOnInit() {
    this.fetchMeterInformation();
    this.fetchDataSmartmeter();
    this.chartDataPredictedValues.labels = this.chartDataCurrentValues.labels;
  }

  /** set the displayed resolution and update the chart to mirror that
   * CONTINUE WITH DECIDING IF GRAPHS ARE INDEPENDEND with buttons or not!
   */
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
    this.chartDataCurrentValues.datasets = [];

    this.savedDatasets = {};
    this.updateCharts();
  }

  /** Completely erases data from predicted graph element */
  resetPredictionChart(): void {
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
    return color;
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
   * train a model for prediction, as long as all parameters are unique
   * @returns nothing, prints answer
   */
  trainModel(): void {
    /** if request parameters are not unique, abandon request */
    if (!this.checkParameters(true)) {
      return;
    }

    this.waterDemandService
      .trainModelOnSingleSmartmeter(
        this.choiceStartPoint(),
        this.choiceSmartmeter(),
        this.choiceTime(),
        this.choiceResolution(),
        this.choiceWeather(),
      )
      .subscribe({
        next: response => {
          alert(response);
        },
        error: error => {
          console.log(error);
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
    /** if request parameters are not unique, abandon request */
    if (!this.checkParameters(false)) {
      return;
    }

    this.waterDemandService
      .fetchSingleSmartmeter(
        this.choiceStartPoint(),
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

          // hacky way to initiate the labels of the predicted chart as well
          if (this.chartDataPredictedValues.labels?.length === 0) {
            this.chartDataPredictedValues.labels = smartmeterdata.labels;
          }

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
    /** if request parameters are not unique, abandon request */
    if (!this.checkParameters(true)) {
      return;
    }

    this.waterDemandService
      .fetchSinglePredictionSmartmeter(
        this.choiceStartPoint(),
        this.choiceSmartmeter(),
        this.choiceTime(),
        this.choiceResolution(),
        this.choiceWeather(),
      )
      .subscribe({
        next: (response: PredictionSingleSmartmeter) => {
          this.currentPredictedSmartmeterData.set(null);
          this.currentPredictedSmartmeterData.set(response);
          console.log(
            "Updated signal value:",
            this.currentPredictedSmartmeterData(),
          );
        },
        error: error => {
          console.log(error);
        },
        complete: () => {
          let newDataset = this.createNewDataset(
            this.currentPredictedSmartmeterData()!.numValue,
            this.currentPredictedSmartmeterData()!.name,
            this.currentPredictedSmartmeterData()!.resolution,
            this.currentPredictedSmartmeterData()!.timeframe,
            false,
            this.chartType(),
          );

          let realDataset = this.createNewDataset(
            this.currentPredictedSmartmeterData()!.realValue,
            "real values" + this.currentPredictedSmartmeterData()!.name,
            this.currentPredictedSmartmeterData()!.resolution,
            this.currentPredictedSmartmeterData()!.timeframe,
            false,
            this.chartType(),
          );

          let lower_conf_int = this.createNewDataset(
            this.currentPredictedSmartmeterData()!.lower_conf_values,
            "lower_confidence_interval",
            this.currentPredictedSmartmeterData()!.resolution,
            this.currentPredictedSmartmeterData()!.timeframe,
            0,
            this.chartType(),
          );

          let upper_conf_int = this.createNewDataset(
            this.currentPredictedSmartmeterData()!.upper_conf_values,
            "upper_confidence_interval",
            this.currentPredictedSmartmeterData()!.resolution,
            this.currentPredictedSmartmeterData()!.timeframe,
            0,
            this.chartType(),
          );

          let smartmeterdata: PredictedSmartmeterDataset = {
            upper_conf_interval_dataset: upper_conf_int,
            dataset: newDataset,
            realValue_dataset: realDataset,
            lower_conf_interval_dataset: lower_conf_int,
            labels: this.currentPredictedSmartmeterData()!.dateObserved,
          };
          if (
            !this.predictedDatasets[
              this.currentPredictedSmartmeterData()!.resolution
            ]
          ) {
            this.predictedDatasets[
              this.currentPredictedSmartmeterData()!.resolution
            ] = [];
          }

          this.predictedDatasets[
            this.currentPredictedSmartmeterData()!.resolution
          ].push(smartmeterdata);

          this.setDisplayedResolution(
            this.currentPredictedSmartmeterData()!.resolution,
          );

          this.showPredictedDatasats(
            this.currentPredictedSmartmeterData()!.resolution,
          );
        },
      });
  }

  /**
   * checks first if all 3 choices are set and returns false when not.
   * afterwards check if resolution key is already in datasets, true when not.
   * last create colorcode from parameters and check if colorcode already present.
   * when colorcode not present, request is unique and thus true.
   * @param pred flag im request is for real or predicted data
   * @returns true if request unique, false else
   */
  checkParameters(pred: boolean): boolean {
    if (this.allowCheckMultiple()) {
      return true;
    }

    if (
      !this.choiceSmartmeter() ||
      !this.choiceResolution() ||
      !this.choiceTime()
    ) {
      alert("Not every parameter for request is set.");
    }

    /** checks if resolution as key is already present in datasetsrecord.
     * If not, request must be true and thus unique */
    if (!pred) {
      if (!this.savedDatasets[this.choiceResolution()]) {
        return true;
      }
    } else {
      if (!this.predictedDatasets[this.choiceResolution()]) {
        return true;
      }
    }

    /** the color is based on 3 unique parameters,
     *  thus, when color is equal, the set is already present */
    let colorToCheck = this.createColorFromParameter(
      this.choiceSmartmeter(),
      this.choiceResolution(),
      this.choiceTime(),
    );

    let errormsg: string =
      "combination already requested \n" +
      this.choiceResolution() +
      "\n" +
      this.choiceSmartmeter() +
      "\n" +
      this.choiceTime();

    /** check if given dataset is already containing the colorcode to request */
    if (!pred) {
      for (let entry of this.savedDatasets[this.choiceResolution()]) {
        if (
          entry.dataset.borderColor === colorToCheck ||
          entry.dataset.backgroundColor === colorToCheck
        ) {
          alert(errormsg);
          return false;
        }
      }
    } else {
      for (let entry of this.predictedDatasets[this.choiceResolution()]) {
        if (
          entry.dataset.borderColor === colorToCheck ||
          entry.dataset.backgroundColor === colorToCheck
        ) {
          alert(errormsg);
          return false;
        }
      }
    }
    return true;
  }

  /** show datasets based on the resolution chosen */
  showDatasets(resolution: string): void {
    // reset data to begin
    this.chartDataCurrentValues.datasets = [];

    if (!this.savedDatasets[resolution]) {
      alert("No suitable chart to show!");
      return;
    }

    /** add relevant datasets based on resolution to chartData */
    this.savedDatasets[resolution].forEach(entry => {
      this.chartDataCurrentValues.datasets.push(entry.dataset);
      this.chartDataCurrentValues.labels = entry.labels;
    });

    /** update charts to display information */
    this.updateCharts(0);
  }

  /** show predicted datasets based on the resolution chosen */
  showPredictedDatasats(resolution: string): void {
    // reset data to begin
    this.chartDataPredictedValues.datasets = [];

    if (!this.predictedDatasets[resolution]) {
      return;
    }

    /** add relevant datasets based on resolution to chartData */
    this.predictedDatasets[resolution].forEach(entry => {
      this.chartDataPredictedValues.datasets.push(entry.dataset);
      this.chartDataPredictedValues.datasets.push(entry.realValue_dataset);
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

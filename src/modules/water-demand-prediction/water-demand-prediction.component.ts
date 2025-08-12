import { ViewChildren, Component, QueryList, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TranslatePipe } from "@ngx-translate/core";
import { ChartConfiguration, ChartData, ChartDataset, ChartType } from "chart.js";
import { BaseChartDirective } from "ng2-charts";
import {
  PredictedSmartmeterDataset,
  SmartmeterDataset
} from "./water-demand-prediction.interface";
import { MeterNames, WaterDemandPredictionService, WeatherColumns } from "../../api/water-demand-prediction.service";
import { DropdownComponent } from "../../common/components/dropdown/dropdown.component";
import { SingleSmartmeter, PredictedSmartmeter } from "../../api/water-demand-prediction.service";
import { signal, Signal, effect } from "@angular/core";


@Component({
  selector: "water-demand-prediction",
  imports: [BaseChartDirective, DropdownComponent, TranslatePipe, CommonModule],
  templateUrl: "./water-demand-prediction.component.html",
  styles: ``,
})
export class WaterDemandPredictionComponent {
  private waterDemandService = inject(WaterDemandPredictionService);

  explainMAE: string =
    "In the context of machine learning, absolute error refers to the magnitude of difference between the prediction of an observation and the true value of that observation. MAE takes the average of absolute errors for a group of predictions and observations as a measurement of the magnitude of errors for the entire group. MAE can also be referred as L1 loss function.";
  explainRMSE: string =
    "Root mean square error or root mean square deviation is one of the most commonly used measures for evaluating the quality of predictions. It shows how far predictions fall from measured true values using Euclidean distance.";
  explainMSE: string =
    "In the fields of regression analysis and machine learning, the Mean Square Error (MSE) is a crucial metric for evaluating the performance of predictive models. It measures the average squared difference between the predicted and the actual target values within a dataset. The primary objective of the MSE is to assess the quality of a model's predictions by measuring how closely they align with the ground truth.";
  explainR2: string =
    "The R-squared metric — R², or the coefficient of determination – is used to measure how well a model fits data, and how well it can predict future outcomes. Simply put, it tells you how much of the variation in your data can be explained by your model. The closer the R-squared value is to one, the better your model fits the data.";


  /** the displayed resolution in the charts of real data */
  displayedResolution = signal<string | undefined>(undefined);

  /** variables resolution dropdown */
  menuResolution = "water-demand-prediction.choice.resolution";
  optionsResolution: Record<string, string> = {
    hourly: "water-demand-prediction.resolution.hourly",
    daily: "water-demand-prediction.resolution.daily",
    weekly: "water-demand-prediction.resolution.weekly",
  };
  choiceResolution = signal<string | undefined>(undefined);

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
  choiceTime = signal<string | undefined>(undefined);

  /** variables name dropdown */
  menuSmartmeter = "water-demand-prediction.choice.smartmeter";
  smartmeterSignal: Signal<MeterNames | undefined> = this.waterDemandService.fetchMeterInformation();
  optionsSmartmeter: Record<string, string> = {};
  choiceSmartmeter = signal<string | undefined>(undefined);

  /** variables startpoint dropdown */
  menuStartPoint = "water-demand-prediction.startpoint.menu";
  optionsStartPoint: Record<string, string> = {
    "2021-05-26 00:00:00": "water-demand-prediction.startpoint.options.a",
    "2021-06-01 00:00:00": "water-demand-prediction.startpoint.options.b",
    "2022-01-01 00:00:00": "water-demand-prediction.startpoint.options.c",
  };
  choiceStartPoint = signal<string | undefined>(undefined);

  menuWeather = "water-demand-prediction.choice.weather";
  optionsWeather: Record<string, string> = {
    plain: "water-demand-prediction.weather.plain",
    air_temperature: "water-demand-prediction.weather.air_temperature",
    precipitation: "water-demand-prediction.weather.precipitation",
    moisture: "water-demand-prediction.weather.moisture",
  };
  choiceWeather = signal<string | undefined>(undefined);

  menuWeatherColumn = "water-demand-prediction.choice.weatherColumn";
  weatherColumnsSignal: Signal<WeatherColumns | undefined> = this.waterDemandService.fetchWeatherCols(this.choiceWeather);
  optionsWeatherColumn: Record<string, string> = {};
  choiceWeatherColumn = signal<string | undefined>(undefined);

  /** data object of current requested Smartmeterdata */
  currentSingleSmartmeterDataSignal: Signal<SingleSmartmeter | undefined> = this.waterDemandService.fetchSmartmeter(this.choiceStartPoint, this.choiceSmartmeter, this.choiceTime, this.choiceResolution)
  currentSmartmeterData: SingleSmartmeter | undefined;

  /** signal to trigger training on button click and store the answer */
  triggerTraining = signal<boolean>(false);
  trainingResp = this.waterDemandService.trainModel(this.choiceStartPoint, this.choiceSmartmeter, this.choiceTime, this.choiceResolution, this.choiceWeather, this.choiceWeatherColumn, this.triggerTraining);

  /** data object of current requested Smartmeterdata */
  triggerFetchPredictedSmartmeterData = signal<boolean>(false);
  currentPredictedSmartmeterDataSignal: Signal<PredictedSmartmeter | undefined> = this.waterDemandService.fetchPrediction(this.choiceStartPoint, this.choiceSmartmeter, this.choiceTime, this.choiceResolution, this.choiceWeather, this.choiceWeatherColumn, this.triggerFetchPredictedSmartmeterData)
  currentPredictedSmartmeterData: PredictedSmartmeter | undefined;

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

  constructor() {

    /** define smartmeter options */
    effect(() => {
      let smartmeters = this.smartmeterSignal();
      if (smartmeters) {
        this.optionsSmartmeter = smartmeters;
      }
    })

    /** updates optionsWeatherColumn when selected weather attribute changes */
    effect(() => {
      let weatherCols = this.weatherColumnsSignal();
      if (weatherCols) {
        this.optionsWeatherColumn = weatherCols;
      }
    })

    /** request current smartmeter data */
    effect(() => {
      let curData = this.currentSingleSmartmeterDataSignal();
      if (curData) {
        this.currentSmartmeterData = curData;
      }
    })

    /** request predicted smartmeter data */
    effect(() => {
      if (this.triggerFetchPredictedSmartmeterData()) {
        let curData = this.currentPredictedSmartmeterDataSignal();
        this.currentPredictedSmartmeterData = curData;
      }
    })

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
    type: ChartType,
  ): ChartDataset {
    let color = "#D3D3D3"; // light grey

    // to display confidence intervalls
    if (fillOption === false) {
      color = this.createColorFromParameter(label, resolution, timeframe);
    }

    const newDataset: ChartDataset = {
      label: label,
      data: data,
      borderColor: color,
      backgroundColor: color,
      fill: fillOption,
      type: type as ChartType,
    };

    return newDataset;
  }

  /**
   * function to fetch data by parameters provided
   * doesnt request data when data is already requested before
   * creates new ChartDatasets and activates the display function
   * @returns nothing
   */
  fetchDataSmartmeter(): void {

    if (!this.currentSmartmeterData) {
      return;
    }

    let newDataset = this.createNewDataset(
      this.currentSmartmeterData.value!,
      this.currentSmartmeterData.name!,
      this.currentSmartmeterData.resolution!,
      this.currentSmartmeterData.timeframe!,
      false,
      this.chartType(),
    );

    let smartmeterdata: SmartmeterDataset = {
      dataset: newDataset,
      labels: this.currentSmartmeterData.date!,
    };

    if (!this.savedDatasets[this.currentSmartmeterData.resolution!]) {
      this.savedDatasets[this.currentSmartmeterData.resolution!] = [];
    }

    this.savedDatasets[this.currentSmartmeterData.resolution!].push(
      smartmeterdata,
    );

    // hacky way to initiate the labels of the predicted chart as well
    if (this.chartDataPredictedValues.labels?.length === 0) {
      this.chartDataPredictedValues.labels = smartmeterdata.labels;
    }

    this.setDisplayedResolution(this.currentSmartmeterData.resolution!);
    this.showDatasets(this.currentSmartmeterData.resolution!);
    this.currentSmartmeterData = undefined;
  }

  fetchPredData(): void {
    //BUG: REDESIGN
    this.triggerFetchPredictedSmartmeterData.set(true);
    this.triggerTraining.set(false);
  }

  trainModel(): void {
    //BUG: REDESIGN
    this.triggerTraining.set(true);
    this.triggerFetchPredictedSmartmeterData.set(false);
  }

  showPredData(): void {

    /** set trigger to true */
    if (!this.currentPredictedSmartmeterData) {
      return;
    }

    let newDataset = this.createNewDataset(
      this.currentPredictedSmartmeterData!.value,
      this.currentPredictedSmartmeterData!.name,
      this.currentPredictedSmartmeterData!.resolution,
      this.currentPredictedSmartmeterData!.timeframe,
      false,
      this.chartType(),
    );

    let realDataset = this.createNewDataset(
      this.currentPredictedSmartmeterData!.realValue,
      "actualValues" + this.currentPredictedSmartmeterData!.name,
      this.currentPredictedSmartmeterData!.resolution,
      this.currentPredictedSmartmeterData!.timeframe,
      false,
      this.chartType(),
    );

    let lower_conf_int = this.createNewDataset(
      this.currentPredictedSmartmeterData!.lowerConfValues,
      "lowerConfidenceInterval",
      this.currentPredictedSmartmeterData!.resolution,
      this.currentPredictedSmartmeterData!.timeframe,
      0,
      this.chartType(),
    );

    let upper_conf_int = this.createNewDataset(
      this.currentPredictedSmartmeterData!.upperConfValues,
      "upperConfidenceInterval",
      this.currentPredictedSmartmeterData!.resolution,
      this.currentPredictedSmartmeterData!.timeframe,
      0,
      this.chartType(),
    );

    let smartmeterdata: PredictedSmartmeterDataset = {
      upper_conf_interval_dataset: upper_conf_int,
      dataset: newDataset,
      realValue_dataset: realDataset,
      lower_conf_interval_dataset: lower_conf_int,
      labels: this.currentPredictedSmartmeterData!.date,
    };

    if (
      !this.predictedDatasets[
      this.currentPredictedSmartmeterData!.resolution
      ]
    ) {
      this.predictedDatasets[
        this.currentPredictedSmartmeterData!.resolution
      ] = [];
    }

    this.predictedDatasets[
      this.currentPredictedSmartmeterData!.resolution
    ].push(smartmeterdata);

    this.setDisplayedResolution(
      this.currentPredictedSmartmeterData!.resolution,
    );

    this.showPredictedDatasets(
      this.currentPredictedSmartmeterData!.resolution,
    );

    /** set trigger back to false */
    this.triggerFetchPredictedSmartmeterData.set(false);
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
  showPredictedDatasets(resolution: string): void {
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

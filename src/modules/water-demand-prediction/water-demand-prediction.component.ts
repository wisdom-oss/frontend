import {CommonModule} from "@angular/common";
import {inject, ViewChildren, Component, QueryList} from "@angular/core";
import {effect, signal, Signal} from "@angular/core";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {ChartConfiguration, ChartData, ChartDataset, ChartType} from "chart.js";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import {BaseChartDirective} from "ng2-charts";

import {WaterDemandPredictionService} from "../../api/water-demand-prediction.service";
import {DropdownComponent} from "../../common/components/dropdown/dropdown.component";
import {stringToColor} from "../../common/stringToColor";

import "dayjs/locale/de";
import "dayjs/locale/en";

dayjs.extend(duration, relativeTime);

type MeterNames = WaterDemandPredictionService.MeterNames;
type WeatherColumns = WaterDemandPredictionService.WeatherColumns;
type SingleSmartmeter = WaterDemandPredictionService.SingleSmartmeter;
type PredictedSmartmeter = WaterDemandPredictionService.PredictedSmartmeter;

@Component({
  selector: "water-demand-prediction",
  imports: [BaseChartDirective, CommonModule, DropdownComponent, TranslatePipe],
  templateUrl: "./water-demand-prediction.component.html",
})
export class WaterDemandPredictionComponent {
  private waterDemandService = inject(WaterDemandPredictionService);

  protected minHeightCharts: string = "15em";
  protected standardHeightCharts: string = "50%";

  /** the displayed resolution in the charts of real data */
  protected displayedResolution = signal<string | undefined>("hourly");

  private currentLang = "water-demand-prediction.dayjs.locale";
  //BUG: dayjs sets locale when initializing variables, cant dynamically chagne them

  /** variables timeframe dropdown */
  protected menuTime = "water-demand-prediction.choice.timeframe";
  protected optionsTime: Record<string, string> = {
    "one day": dayjs.duration(1, "days").humanize(),
    "one week": dayjs.duration(1, "week").humanize(),
    "one month": dayjs.duration(1, "month").humanize(),
    "three months": dayjs.duration(3, "month").humanize(),
    "six months": dayjs.duration(6, "month").humanize(),
    "one year": dayjs.duration(1, "year").humanize(),
    all: dayjs.duration(3, "year").humanize(),
  };
  readonly choiceTime = signal<string | undefined>(undefined);

  /** variables startpoint dropdown */
  protected menuStartPoint = "water-demand-prediction.startpoint.menu";
  private startOfData = dayjs(new Date(2021, 4, 26, 0, 0, 0)).format(
    "YYYY-MM-DD HH:mm:ss",
  );
  private startofJune = dayjs(new Date(2021, 5, 1, 0, 0, 0)).format(
    "YYYY-MM-DD HH:mm:ss",
  );
  private startOfYear22 = dayjs(new Date(2022, 0, 1, 0, 0, 0)).format(
    "YYYY-MM-DD HH:mm:ss",
  );
  protected optionsStartPoint: Record<string, string> = {
    [this.startOfData]: "water-demand-prediction.startpoint.options.a",
    [this.startofJune]: "water-demand-prediction.startpoint.options.b",
    [this.startOfYear22]: "water-demand-prediction.startpoint.options.c",
  };
  readonly choiceStartPoint = signal<string | undefined>(undefined);

  /** variables resolution dropdown */
  protected menuResolution = "water-demand-prediction.choice.resolution";
  protected optionsResolution: Record<string, string> = {
    hourly: "water-demand-prediction.resolution.hourly",
    daily: "water-demand-prediction.resolution.daily",
    weekly: "water-demand-prediction.resolution.weekly",
  };
  readonly choiceResolution = signal<string | undefined>(undefined);

  /** variables name dropdown */
  menuSmartmeter = "water-demand-prediction.choice.smartmeter";
  smartmeterSignal: Signal<MeterNames | undefined> =
    this.waterDemandService.fetchMeterInformation();
  optionsSmartmeter: Record<string, string> = {};
  choiceSmartmeter = signal<string | undefined>(undefined);

  protected menuWeather = "water-demand-prediction.choice.weather";
  protected optionsWeather: Record<string, string> = {
    plain: "water-demand-prediction.weather.plain",
    air_temperature: "water-demand-prediction.weather.air_temperature",
    precipitation: "water-demand-prediction.weather.precipitation",
    moisture: "water-demand-prediction.weather.moisture",
  };
  readonly choiceWeather = signal<string | undefined>(undefined);

  protected menuWeatherColumn = "water-demand-prediction.choice.weatherColumn";
  readonly weatherColumnsSignal: Signal<WeatherColumns | undefined> =
    this.waterDemandService.fetchWeatherCols(this.choiceWeather);
  protected optionsWeatherColumn: Record<string, string> = {};
  readonly choiceWeatherColumn = signal<string | undefined>(undefined);

  /** data object of current requested Smartmeterdata */
  readonly currentSingleSmartmeterDataSignal: Signal<
    SingleSmartmeter | undefined
  > = this.waterDemandService.fetchSmartmeter({
    startpoint: this.choiceStartPoint,
    name: this.choiceSmartmeter,
    timeframe: this.choiceTime,
    resolution: this.choiceResolution,
  });
  private currentSmartmeterData: SingleSmartmeter | undefined;

  /** signal to trigger training on button click and store the answer */
  protected triggerTraining = signal<boolean>(false);
  protected modalOpen = signal(false);
  readonly trainingResp = this.waterDemandService.trainModel({
    startpoint: this.choiceStartPoint,
    name: this.choiceSmartmeter,
    timeframe: this.choiceTime,
    resolution: this.choiceResolution,
    weatherCapability: this.choiceWeather,
    weatherColumn: this.choiceWeatherColumn,
    trigger: this.triggerTraining,
  });

  /** data object of current requested Smartmeterdata */
  readonly triggerFetchPredictedSmartmeterData = signal<boolean>(false);
  readonly currentPredictedSmartmeterDataSignal: Signal<
    PredictedSmartmeter | undefined
  > = this.waterDemandService.fetchPrediction({
    startpoint: this.choiceStartPoint,
    name: this.choiceSmartmeter,
    timeframe: this.choiceTime,
    resolution: this.choiceResolution,
    weatherCapability: this.choiceWeather,
    weatherColumn: this.choiceWeatherColumn,
    trigger: this.triggerFetchPredictedSmartmeterData,
  });
  protected currentPredictedSmartmeterData: PredictedSmartmeter | undefined;

  /** Record to hold all saved ChartDatasets */
  private savedDatasets: Record<string, SmartmeterDataset[]> = {};

  /** Record to hold all saved predicted ChartDatasets */
  private predictedDatasets: Record<string, PredictedSmartmeterDataset[]> = {};

  /**
   * data skeleton for the line graph
   */
  protected chartDataCurrentValues: ChartData = {
    labels: [], // X-axis labels
    datasets: [], // data points
  };

  /**
   * data skeleton for the line graph
   */
  protected chartDataPredictedValues: ChartData = {
    labels: [], // X-axis labels
    datasets: [], // data points
  };

  /**
   * type of graph to use in chart
   * as a signal to change it via template
   */
  protected chartType = signal<ChartType>("line");

  /**
   * options used for the line chart to visualize prediction values
   */
  protected chartOptions: ChartConfiguration["options"] = {
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

  constructor(private translateService: TranslateService) {
    dayjs.locale(this.translateService.currentLang || "en");

    // update dayjs whenever language changes
    this.translateService.onLangChange.subscribe(event => {
      dayjs.locale(event.lang);
    });

    /** define smartmeter options */
    effect(() => {
      let smartmeters = this.smartmeterSignal();
      if (smartmeters) {
        this.optionsSmartmeter = smartmeters;
      }
    });

    /** updates optionsWeatherColumn when selected weather attribute changes */
    effect(() => {
      let weatherCols = this.weatherColumnsSignal();
      if (weatherCols) {
        this.optionsWeatherColumn = weatherCols;
      }
    });

    /** request current smartmeter data */
    effect(() => {
      let curData = this.currentSingleSmartmeterDataSignal();
      if (curData) {
        this.currentSmartmeterData = curData;
      }
    });

    /** request predicted smartmeter data */
    effect(() => {
      if (this.triggerFetchPredictedSmartmeterData()) {
        let curData = this.currentPredictedSmartmeterDataSignal();
        this.currentPredictedSmartmeterData = curData;
      }
    });

    effect(() => {
      let info = this.trainingResp();
      if (info) {
        this.modalOpen.set(true);
      }
    });
  }

  /** set displayed resolution and update chart to mirror that */
  protected setDisplayedResolution(resolution: string): void {
    this.displayedResolution.set(resolution);
  }

  /**
   * update all charts in ViewChildren
   * update only one chart based on index given, when given one.
   * @returns if there is no chart
   */
  protected updateCharts(indexOfChart?: number): void {
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
  protected resetChart(): void {
    this.chartDataCurrentValues.datasets = [];

    this.savedDatasets = {};
    this.updateCharts();
  }

  /** Completely erases data from predicted graph element */
  protected resetPredictionChart(): void {
    this.chartDataPredictedValues.datasets = [];

    this.predictedDatasets = {};
    this.updateCharts();
  }

  /** helper function to create a color from values */
  protected createColorFromParameter(
    label: string,
    resolution: string,
    timeframe: string,
  ): string {
    return stringToColor(label + resolution + timeframe);
  }

  /**
   * create a new dataset for chartjs from the given data
   * @param label label of the chartdata
   * @param data data points
   * @param fillOption: false, 0 for confidence interval
   * @returns new dataset
   */
  protected createNewDataset(
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
  protected fetchDataSmartmeter(): void {
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

  /** inverts the training signal */
  protected trainModel(): void {
    this.triggerFetchPredictedSmartmeterData.set(
      false,
    ); /** set up false to make sure training and prediction doesnt happen at the same time */
    this.triggerTraining.set(!this.triggerTraining());
  }

  protected fetchPredData(): void {
    this.triggerTraining.set(
      false,
    ); /** set up false to make sure training and prediction doesnt happen at the same time */
    this.triggerFetchPredictedSmartmeterData.set(
      !this.triggerFetchPredictedSmartmeterData(),
    );
  }

  protected showPredData(): void {
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
      upperConfIntervalDataset: upper_conf_int,
      dataset: newDataset,
      realValueDataset: realDataset,
      lowerConfIntervalDataset: lower_conf_int,
      labels: this.currentPredictedSmartmeterData!.date,
    };

    if (
      !this.predictedDatasets[this.currentPredictedSmartmeterData!.resolution]
    ) {
      this.predictedDatasets[this.currentPredictedSmartmeterData!.resolution] =
        [];
    }

    this.predictedDatasets[
      this.currentPredictedSmartmeterData!.resolution
    ].push(smartmeterdata);

    this.setDisplayedResolution(
      this.currentPredictedSmartmeterData!.resolution,
    );

    this.showPredictedDatasets(this.currentPredictedSmartmeterData!.resolution);
  }

  /** show datasets based on the resolution chosen */
  protected showDatasets(resolution: string): void {
    // reset data to begin
    this.chartDataCurrentValues.datasets = [];

    if (!this.savedDatasets[resolution]) {
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
  protected showPredictedDatasets(resolution: string): void {
    // reset data to begin
    this.chartDataPredictedValues.datasets = [];

    if (!this.predictedDatasets[resolution]) {
      return;
    }

    /** add relevant datasets based on resolution to chartData */
    this.predictedDatasets[resolution].forEach(entry => {
      this.chartDataPredictedValues.datasets.push(entry.dataset);
      this.chartDataPredictedValues.datasets.push(entry.realValueDataset);
      this.chartDataPredictedValues.datasets.push(
        entry.lowerConfIntervalDataset,
      );
      this.chartDataPredictedValues.datasets.push(
        entry.upperConfIntervalDataset,
      );
      this.chartDataPredictedValues.labels = entry.labels;
    });

    /** update charts to display information */
    this.updateCharts(1);
  }

  protected closeModal() {
    this.modalOpen.set(false);
  }
}

export type SmartmeterDataset = {
  dataset: ChartDataset;
  labels: string[];
};

export type PredictedSmartmeterDataset = {
  dataset: ChartDataset;
  labels: string[];
  lowerConfIntervalDataset: ChartDataset;
  upperConfIntervalDataset: ChartDataset;
  realValueDataset: ChartDataset;
};

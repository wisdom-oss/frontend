import {ChartDataset} from "chart.js";

/**
 * interface for the response to the single smartmeter data values
 */
export interface SingleSmartmeter {
  name: string;
  resolution: string;
  timeframe: string;
  numValue: number[];
  dateObserved: string[];
}

export interface PredictionSingleSmartmeter extends SingleSmartmeter {
  lower_conf_values: [];
  upper_conf_values: [];
  realValue: [];
  meanAbsoluteError: number;
  meanSquaredError: number;
  rootOfmeanSquaredError: number;
  r2: number;
  aic: number;
  fit_time: string;
}

export interface SmartmeterDataset {
  dataset: ChartDataset;
  labels: string[];
}

export interface PredictedSmartmeterDataset extends SmartmeterDataset {
  lower_conf_interval_dataset: ChartDataset;
  upper_conf_interval_dataset: ChartDataset;
  realValue_dataset: ChartDataset;
}

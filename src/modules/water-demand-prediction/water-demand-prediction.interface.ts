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

export interface SmartmeterDataset {
  dataset: ChartDataset;
  labels: string[];
}

export interface PredictedSmartmeterDataset extends SmartmeterDataset {
  lower_conf_interval_dataset: ChartDataset;
  upper_conf_interval_dataset: ChartDataset;
}

export interface DatasetSmartmeter extends SingleSmartmeter {
  color: string;
}

export interface PredictionSingleSmartmeter extends SingleSmartmeter {
  lower_conf_values: [];
  upper_conf_values: [];
}

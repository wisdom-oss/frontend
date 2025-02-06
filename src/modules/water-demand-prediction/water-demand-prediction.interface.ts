/**
 * interface for the response to the single smartmeter data values
 */
export interface SingleSmartmeter {
  name: string;
  resolution: string;
  timeframe: string;
  numValue: [];
  dateObserved: [];
}

export interface DatasetSmartmeter extends SingleSmartmeter {
  color: string;
}

export interface PredictionSingleSmartmeter extends SingleSmartmeter{
  lower_conf_values: [];
  upper_conf_values: [];
}



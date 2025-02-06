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

export interface PredictionSingleSmartmeter {
  name: string;
  resolution: string;
  timeframe: string;
  lower_conf_values: [];
  upper_conf_values: [];
  pred_values: [];
  dateObserved: [];
}



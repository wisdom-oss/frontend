/**
 * interface for the response to the single smartmeter data values
 */
export interface SingleSmartmeter {
  name: string;
  resolution: string;
  numValue: [];
  dateObserved: [];
}

export interface KindOfSmartmeter {
  data: string[];
}

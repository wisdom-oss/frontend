export interface PhysicalMeter {
  address: {
    addressCountry: string;
    addressLocality: string;
    streetAddress: string;
  };
  category: string;
  date: string;
  description: string;
  id: string;
  type: string;
}

export interface AllPhysicalMeters {
  meters: PhysicalMeter[];
}

export interface VirtualMeter {
  dateCreated: string;
  description: string;
  id: string;
  submeterIds: string[];
  supermeterIds: string[];
}

export interface AllVirtualMeters {
  virtualMeters: VirtualMeter[];
}

export interface Algorithm {
  description: string;
  estimatedTrainingTime: number | null;
  name: string;
}

export interface AllAlgorithms {
  algorithms: Algorithm[];
}

export interface MLModel {
  algorithm: string;
  comment: string;
  dateCreated: string;
  dateModified: string;
  description: string;
  evaluation: {
    actualTestConsumption: number[];
    metrics: {
      mape: number;
      mse: number;
      rmse: number;
      smape: number;
    };
    predictedTestConsumption: number[];
    testCovariates: {
      day: number[];
      is_holiday: number[];
      is_weekend: number[];
      month: number[];
      //TODO check if this is correct precipitation_mm
      precipitation_mm: number[];
      year: number[];
    };
    testTimestamps: number[];
  };
  hyperparameters: {
    country_holidays: string;
    daily_seasonality: number;
    weekly_seasonality: number;
    yearly_seasonality: number;
  };
  id: string;
  inputAttributes: [
    waterConsumption: string,
    day: string,
    month: string,
    year: string,
    is_weekend: string,
    is_holiday: string,
    // precipitation (mm) original
    precipitation_mm: string,
  ];
  isDefault: boolean;
  isModelValid: boolean;
  mlFramework: string;
  refMeter: string;
}

export interface AllModels {
  MLModels: MLModel[];
}

export interface ForeCast {
  covariateValues: {
    day: number;
    is_holiday: number;
    is_weekend: number;
    month: number;
    "precipitation (mm)": number;
    year: number;
  };
  datePredicted: string;
  histRefValues: Record<string, any>; // This represents an empty object {}
  id: string;
  numValue: number;
  refDevice: string;
  type: string;
  unit: string;
}

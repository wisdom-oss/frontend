export type SimulationParameter = {
  time: string,
  rainAmount: number, 
  waterLevel: number
}

export type SimulationIntervalOption= '5 min' | '10 min' | '15 min' | '30 min' | '1 h';
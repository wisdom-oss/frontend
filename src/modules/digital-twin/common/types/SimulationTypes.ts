import dayjs from "dayjs";

export type SimulationParameter = {
  time: string;
  rainAmount: number;
  waterLevel: number;
};

export const SimulationIntervalOption = {
  "5 min": dayjs.duration(5, "m"),
  "10 min": dayjs.duration(10, "m"),
  "15 min": dayjs.duration(15, "m"),
  "30 min": dayjs.duration(30, "m"),
  "1 h": dayjs.duration(1, "h"),
}

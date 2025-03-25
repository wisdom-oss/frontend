import {DatePipe} from "@angular/common";
import {CommonModule} from "@angular/common";
import {
  signal,
  viewChild,
  Component,
  OnInit,
  Signal,
  WritableSignal,
} from "@angular/core";
import {FormsModule} from "@angular/forms";
import {provideIcons, NgIcon} from "@ng-icons/core";
import {remixAddLine, remixDeleteBin5Line} from "@ng-icons/remixicon";
import {TranslatePipe} from "@ngx-translate/core";
import {
  ChartConfiguration,
  ChartData,
  ChartDataset,
  Plugin,
  ChartType,
} from "chart.js";
import dayjs from "dayjs";
import {BaseChartDirective} from "ng2-charts";

import {BeWaterSmartService} from "../../api/be-water-smart.service";
import {DropdownComponent} from "../../common/components/dropdown/dropdown.component";
import {TransformStringPipe} from "../../core/pipes/transform-string.pipe";

@Component({
  templateUrl: "be-water-smart.component.html",
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    TransformStringPipe,
    DatePipe,
    BaseChartDirective,
    NgIcon,
    DropdownComponent,
  ],
  providers: [provideIcons({remixAddLine, remixDeleteBin5Line})],
  styleUrl: "be-water-smart.scss",
})
export class BeWaterSmartComponent implements OnInit {
  // ---------- StringFormatting ----------

  prefixes: string[] = ["urn:ngsi-ld:virtualMeter:", "urn:ngsi-ld:Device:"]; //array of prefixes to remove from id-strings of smart meters

  // ---------- Dropdowns ----------

  menuAlgorithm: Signal<string> = signal("be-water-smart.hints.algorithm");
  optionsAlgorithm: WritableSignal<Record<string, string>> = signal({});
  choiceAlgorithm: WritableSignal<string | undefined> = signal(undefined);

  menuVirtualMeter: Signal<string> = signal(
    "be-water-smart.hints.virtual_meter",
  );
  optionsVirtualMeter: WritableSignal<Record<string, string>> = signal({});
  choiceVirtualMeter: WritableSignal<string | undefined> = signal(undefined);

  // ---------- Physical Meter Parameters ----------

  pMeters: WritableSignal<BeWaterSmartService.PhysicalMeters["meters"]> =
    signal([]); // list of physical meters | jsonobjects
  selectedPhysicalMeters: WritableSignal<
    BeWaterSmartService.PhysicalMeters["meters"]
  > = signal([]); // list of selected physical meters for virtual meter creation

  // ---------- Virtual Meter Parameters ----------

  vMeters: WritableSignal<BeWaterSmartService.VirtualMeters["virtualMeters"]> =
    signal([]); // list of virtual meters | jsonobjects
  selectedVirtualMeters: WritableSignal<
    BeWaterSmartService.VirtualMeters["virtualMeters"]
  > = signal([]); // a list of selectedVirtualMeters to create a Super Meter
  selectedVirtualMeter: WritableSignal<
    BeWaterSmartService.VirtualMeter | undefined
  > = signal(undefined); // selected virtual meter to train a model
  newVMeterName: WritableSignal<string> = signal(""); // name of potential new virtual meter
  newSuperMeterName: WritableSignal<string> = signal(""); // name of potential new virtual meter created from other virtual meters

  // ---------- Algorithm Parameters ----------

  algorithms: WritableSignal<BeWaterSmartService.Algorithms["algorithms"]> =
    signal([]); // list of all Algorithm
  selectedAlgorithm: WritableSignal<BeWaterSmartService.Algorithm | undefined> =
    signal(undefined); // algorithm to train with a virtual meter
  models: WritableSignal<BeWaterSmartService.Models["MLModels"]> = signal([]); // all trained models
  selectedModel: WritableSignal<BeWaterSmartService.Model | undefined> =
    signal(undefined); // selected model for consumption forecast
  modelComment: WritableSignal<string | undefined> = signal(undefined); // comment to reidentify a model

  // ------------------------------ Chart Parameters --------------------------------------------

  chartRef = viewChild(BaseChartDirective);

  chartType: ChartType = "line"; // type of graph to use in chart
  chartOptions: ChartConfiguration["options"] = {
    //options used for the line chart to visualize prediction values
    responsive: true,
    scales: {
      y: {
        stacked: false,
        title: {
          display: true,
          text: "m^3",
        },
        grid: {
          display: true, // Show grid lines on the y-axis
          color: "#e0e0e0", // Customize the grid line color
          lineWidth: 0.2, // Set the width of the grid lines
        },
      },
      x: {
        title: {
          display: true,
          text: "Time",
        },
        grid: {
          display: false, // Show grid lines on the y-axis
          color: "#e0e0e0", // Customize the grid line color
          lineWidth: 0.2, // Set the width of the grid lines
        },
      },
    },
  };

  standardLabels: string[] = Array.from({length: 23}, (_, i) => `${i + 1}:00`);

  chartColor: string = "#FFFFFF"; //  color of the ng2chart
  chartData: ChartData<"line"> = {
    // data skeleton for the line graph
    labels: this.standardLabels, // X-axis labels
    datasets: [], // data points
  };

  backgroundPlugin: Plugin<"bar"> = {
    id: "custom_canvas_background_color",
    beforeDraw: chart => {
      const ctx = chart.ctx;
      ctx.save();
      ctx.fillStyle = this.chartColor; // Set the background color to white
      ctx.fillRect(0, 0, chart.width, chart.height);
      ctx.restore();
    },
  };

  chartPlugins = [this.backgroundPlugin];

  constructor(public bwsService: BeWaterSmartService) {}

  ngOnInit(): void {
    this.extractPMeters();
    this.extractVMeters();
    this.extractAlgorithms();
    this.extractModels();
  }

  // ---------- Extracting Functions ----------

  extractPMeters(): void {
    this.bwsService.fetchPhysicalMeters().then(data => {
      this.pMeters.set(data.meters);
    });
  }

  extractVMeters(): void {
    this.bwsService.fetchVirtualMeters().then(data => {
      let virtualMeters: Record<string, string> = {};
      data.virtualMeters.forEach(virtualMeter => {
        const ids = virtualMeter.id.split(":");
        virtualMeters[virtualMeter.id] = ids[ids.length - 1];
      });
      this.optionsVirtualMeter.set(virtualMeters);
      this.vMeters.set(data.virtualMeters);
    });
  }

  getVirtualMeter(
    virtualMeterId: string,
  ): BeWaterSmartService.VirtualMeter | undefined {
    const vMeter = this.vMeters().filter(
      vMeter => vMeter.id === virtualMeterId,
    );
    if (!vMeter.length) return undefined;
    return vMeter[0];
  }

  extractAlgorithms(): void {
    this.bwsService.fetchAlgorithms().then(data => {
      let algorithms: Record<string, string> = {};
      data.algorithms.forEach(algorithm => {
        algorithms[algorithm.name] = algorithm.name;
      });
      this.optionsAlgorithm.set(algorithms);
      this.algorithms.set(data.algorithms);
    });
  }

  getAlgorithm(
    algorithmName: string,
  ): BeWaterSmartService.Algorithm | undefined {
    const algorithm = this.algorithms().filter(
      algorithm => algorithm.name === algorithmName,
    );
    if (!algorithm.length) return undefined;
    return algorithm[0];
  }

  extractModels(): void {
    this.bwsService.fetchModels().then(data => {
      this.models.set(data.MLModels);
    });
  }

  // ---------- Checkbox Functions ----------

  toggleSelectedMeter(
    item: BeWaterSmartService.VirtualMeter | BeWaterSmartService.PhysicalMeter,
    event: Event,
    meters: WritableSignal<any[]>,
  ): void {
    const isChecked = (event.target as HTMLInputElement).checked;

    if (isChecked) {
      meters().push(item);
    } else {
      let newMeters = meters();
      newMeters = newMeters.filter(value => !(value === item));
      meters.set(newMeters);
    }
  }

  /**
   * makes only one trained model selectable at a time for forecasting
   * @param item variable holding the checkbox information
   */
  toggleSelectedModel(item: BeWaterSmartService.Model) {
    if (this.selectedModel() === item) {
      this.selectedModel.set(undefined); // Untick the selected item
    } else {
      this.selectedModel.set(item); // Tick the selected item
    }
  }

  // ---------- VirtualMeterList Functions ----------

  /**
   * creates a new VMeter with an @input name and the id-list of the selected physical meters.
   * If successful, user gets informed and all global variables get set back.
   * If failed, user gets informed
   */
  addVMeter(selectedMeters: any, selectedMeter: string): void {
    if (!selectedMeter) {
      alert("No Name for Virtual Meter!");
      return;
    }

    this.bwsService
      .addVirtualMeterWithId(
        selectedMeter,
        this.createSubMeterList(selectedMeters),
      )
      .then(response => {
        if (response.hasOwnProperty("virtualMeterId")) {
          this.extractVMeters();
          this.selectedPhysicalMeters.set([]);
          this.selectedVirtualMeters.set([]);
          this.newVMeterName.set("");
          this.newSuperMeterName.set("");
        }
      });
  }

  /**
   * help function for addVMeter()
   * @returns a list of all ids which are inside the virtual meter
   */
  createSubMeterList(selectedMeters: any): {submeterIds: string[]} {
    let id_list: string[] = [];

    selectedMeters.forEach((item: {id: string}) => {
      id_list.push(item.id);
    });

    return {submeterIds: id_list};
  }

  deleteVMeterById(id: string, index: number): void {
    const tmp = this.vMeters().splice(index, 1);

    this.bwsService.delVirtualMeterById(id).then(response => {
      if (response && response.hasOwnProperty("msg")) {
        this.vMeters().push(tmp[0]);
        alert(
          `Virtual Meter with Name ${id} not found and can not be deleted!`,
        );
      }
    });
  }

  // ---------- Algorithm Functions ----------

  /**
   * train one of the Models and retrieve the training data
   */
  trainModel(): void {
    const choiceVirtualMeter = this.choiceVirtualMeter();
    if (choiceVirtualMeter) {
      this.selectedVirtualMeter.set(this.getVirtualMeter(choiceVirtualMeter));
    }

    const selectedVirtualMeter = this.selectedVirtualMeter();
    if (!selectedVirtualMeter) {
      console.log("No Virtual Meter detected!");
      return;
    }

    const choiceAlgorithm = this.choiceAlgorithm();
    if (choiceAlgorithm) {
      this.selectedAlgorithm.set(this.getAlgorithm(choiceAlgorithm));
    }

    const selectedAlgorithm = this.selectedAlgorithm();
    if (!selectedAlgorithm) {
      console.log("No algorithm detected!");
      return;
    }

    const modelComment = this.modelComment();
    if (!modelComment) {
      alert("a comment is necessary!");
      return;
    }

    this.bwsService
      .putTrainModel(selectedVirtualMeter, selectedAlgorithm, modelComment)
      .then(_ => {
        this.extractModels();
        this.choiceAlgorithm.set(undefined);
        this.selectedAlgorithm.set(undefined);
        this.selectedVirtualMeter.set(undefined);
        this.modelComment.set(undefined);
      });
  }

  deleteModel(vMeterId: string, algId: string, index: number): void {
    let tmp = this.models().splice(index, 1);

    this.bwsService.delModel(vMeterId, algId).then(response => {
      if (response && response.hasOwnProperty("message")) {
        this.models().push(tmp[0]);
        alert("Model not found");
      }
    });
  }

  // ---------- Forecast Creation -----------

  /**
   * create forecast by receiving data from api and displaying it in a graph
   * @returns if a value for the api request is missing
   */
  getForecast(): void {
    const selectedModel = this.selectedModel();
    if (!selectedModel) {
      alert("No model chosen");
      return;
    }

    const vMeterId = selectedModel.refMeter;
    const algId = selectedModel.algorithm;

    this.bwsService.getCreateForecast(vMeterId, algId).then(response => {
      if (response.hasOwnProperty("msg")) {
        console.log(response);
      } else {
        let predValues = response.map(item => item.numValue);

        let date = response[0].datePredicted;

        let label =
          vMeterId.replace(this.prefixes[0], "") +
          " " +
          algId +
          " " +
          dayjs(date).format("DD.MM.YY");

        this.addGraphToChart(predValues, label);
      }
    });
  }

  /**
   * Function to add new lines dynamically to the graph
   * @param label new data label
   * @param dataPoints the new prediction values
   * @param borderColor color to use
   */
  addGraphToChart(dataPoints: number[], label: string): void {
    // Create a new dataset
    const newDataset: ChartDataset<"line"> = {
      label: label,
      data: dataPoints,
      borderColor: this.generateRandomColor(),
      fill: false,
    };

    // Add the new dataset to the existing chart data
    this.chartData.datasets.push(newDataset);

    // Update the chart to reflect the changes
    if (this.chartRef()) {
      this.chartRef()?.update();
    }
  }

  /**
   * generate a random color from the color wheel
   * @returns random color code as string
   */
  generateRandomColor(): string {
    const r = Math.floor(Math.random() * 256); // Random red value (0-255)
    const g = Math.floor(Math.random() * 256); // Random green value (0-255)
    const b = Math.floor(Math.random() * 256); // Random blue value (0-255)

    return `rgb(${r}, ${g}, ${b})`; // Return the color in rgb() format
  }
}

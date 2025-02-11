import { Component, OnInit, ViewChild } from "@angular/core";
import { DatePipe } from "@angular/common";
import { TranslateService } from "@ngx-translate/core";

import { ChartType, ChartConfiguration, ChartDataset, ChartData, Plugin } from "chart.js";
import { BaseChartDirective } from "ng2-charts";
import { Observable } from "rxjs";

import { BeWaterSmartService } from "../../api/be-water-smart.service";
import { Algorithm, PhysicalMeter, VirtualMeter, MLModel } from "./bws-interfaces";
import { CommonModule, NgFor } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from "@ngx-translate/core";
import { TransformStringPipe } from "../../common/pipes/transform-string.pipe";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { ionAddOutline, ionTrashOutline } from "@ng-icons/ionicons"

@Component({
  selector: 'be-water-smart',
  templateUrl: "be-water-smart.component.html",
  imports: [NgFor, CommonModule, FormsModule, TranslatePipe, TransformStringPipe, DatePipe, BaseChartDirective, NgIcon],
  providers: [provideIcons({ ionAddOutline, ionTrashOutline })],
  styleUrls: ['be-water-smart.css']
})
export class BeWaterSmartComponent implements OnInit {

  // ---------- StringFormatting ----------

  /**
   * array of prefixes to remove from id-strings of smart meters
   */
  prefixes: string[] = ["urn:ngsi-ld:virtualMeter:", "urn:ngsi-ld:Device:"];

  // ---------- Layout Parameters ---------- 

  slice: number = 20;
  heightMC: string = "500px";
  heightMF: string = "250px";
  heightLS: string = "500px";
  heightTable: string = "300px";

// ------------------------------ Chart Parameters --------------------------------------------

  /**
   * The chart object, referenced from the html template
   */
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  /**
   * type of graph to use in chart
   */
  chartType: ChartType = 'line';

  /**
   * options used for the line chart to visualize prediction values
   */
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      y: {
        stacked: false,
        title: {
          display: true,
          text: "m^3"
        },
        grid: {
          display: true, // Show grid lines on the y-axis
          color: '#e0e0e0', // Customize the grid line color
          lineWidth: 0.2, // Set the width of the grid lines
        },
      },
      x: {
        title: {
          display: true,
          text: "Time"
        },
        grid: {
          display: false, // Show grid lines on the y-axis
          color: '#e0e0e0', // Customize the grid line color
          lineWidth: 0.2, // Set the width of the grid lines
        },
      }
    },

  };

  /**
   * standard xAxis labels for prediction values
   */
  standardLabels: string[] = ['01:00', '02:00', '03:00',
    '04:00', '05:00', '06:00', '07:00',
    '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00',
    '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00', '23:00']

  /**
   * color of the ng2chart
   */
  chartColor: string = '#000000';

  /**
   * data skeleton for the line graph
   */
  chartData: ChartData<'line'> = {
    labels: this.standardLabels, // X-axis labels
    datasets: [], // data points
  };

  backgroundPlugin: Plugin<'bar'> = {
    id: 'custom_canvas_background_color',
    beforeDraw: (chart) => {
      const ctx = chart.ctx;
      ctx.save();
      ctx.fillStyle = this.chartColor; // Set the background color to white
      ctx.fillRect(0, 0, chart.width, chart.height);
      ctx.restore();
    }
  };


  chartPlugins = [this.backgroundPlugin];

  // ---------- Physical Meter Parameters ----------

  /**
   * list of physical meters | jsonobjects
   */
  pMeters: PhysicalMeter[] = [];

  /**
   * list of selected physical meters for virtual meter creation
   */
  selectedPhysicalMeters: PhysicalMeter[] = [];

  // ---------- Virtual Meter Parameters ----------

  /**
   * list of virtual meters | jsonobjects
   */
  vMeters: VirtualMeter[] = [];

  /**
   * a list of selectedVirtualMeters to create a Super Meter
   */
  selectedVirtualMeters: VirtualMeter[] = [];

  /**
   * selected virtual meter to train a model
   */
  selectedVirtualMeter: VirtualMeter | undefined;

  /**
   * name of potential new virtual meter
   */
  newVMeterName: string = "";

  /**
   * name of potential new virtual meter created from other virtual meters
   */
  newSuperMeterName: string = "";

  // ---------- Algorithm Parameters ----------

  /**
   * list of all Algorithm
   */
  algorithms: Algorithm[] = [];

  /**
   * algorithm to train with a virtual meter
   */
  selectedAlgorithm: Algorithm | undefined;

  /**
   * all trained models
   */
  models: MLModel[] = [];

  /**
   * selected model for consumption forecast
   */
  selectedModel: MLModel | undefined;

  /**
   * comment to reidentify a model
   */
  modelComment: string | undefined;

  /**
   * flags if a delete operation is in progress
   * @param isDeleting: boolean flag 
   */
  isDeleting: boolean = false;

  constructor(public bwsService: BeWaterSmartService, private translate: TranslateService) { }

  ngOnInit(): void {
    // initialize all displays when rendering web page
    this.extractPMeters()
    this.extractVMeters();
    this.extractAlgorithms();
    this.extractModels();

  }

  // ---------- Extracting Functions ----------

  /**
   * Generic Extraction Method for B-Water-Smart
   * @param extractionMethod the function to use for the api call
   * @param responseField the field of the response to read
   * @param destinationField the parameter to save data to
   */
  extractData(extractionMethod: () => Observable<any>, responseField: string, destinationField: keyof this): void {
    extractionMethod().subscribe({
      next: (response) => {
        // Dynamically assign the response field to the destination field
        this[destinationField] = response[responseField];
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  /**
   * calls bws service to retrieve all physical meter information
   */
  extractPMeters(): void {
    this.extractData(
      () => this.bwsService.getPhysicalMeters(),
      'meters',
      'pMeters'
    );
  }

  /**
   * calls bws service to retrieve all virtual meter information
   */
  extractVMeters(): void {
    this.extractData(() => this.bwsService.getVirtualMeters(),
      'virtualMeters', 'vMeters')
  }

  /**
   * calls bws service to retrieve all algorithms
   */
  extractAlgorithms(): void {
    this.extractData(
      () => this.bwsService.getAlgorithms(),
      'algorithms',
      'algorithms'
    )
  }

  /**
   * calls bws service to retrieve all trained models
   */
  extractModels(): void {
    this.extractData(
      () => this.bwsService.getModels(),
      'MLModels',
      'models'
    )
  }

  // ---------- Checkbox Functions ----------

  toggleSelectedMeter(item: any, event: Event, selectedMeters: any): void {
    const isChecked = (event.target as HTMLInputElement).checked;

    if (isChecked) {
      selectedMeters.push(item)
    } else {
      const index = selectedMeters.findIndex((meter: { id: any; }) => meter.id === item.id)
      if (index > -1) {
        selectedMeters.splice(index, 1); // Remove the item if unchecked
      }
    }
  }

  /**
   * makes only one trained model selectable at a time for forecasting
   * @param item variable holding the checkbox information
   */
  toggleSelectedModel(item: any) {
    if (this.selectedModel === item) {
      this.selectedModel = undefined; // Untick the selected item
    } else {
      this.selectedModel = item; // Tick the selected item
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

    this.bwsService.addVirtualMeterWithId(selectedMeter, this.createSubMeterList(selectedMeters)).subscribe({
      next: (response) => {
        if (response.hasOwnProperty("virtualMeterId")) {
          this.extractVMeters();
          this.selectedPhysicalMeters = [];
          this.selectedVirtualMeters = [];
          this.newVMeterName = "";
          this.newSuperMeterName = "";
        }
      },
      error: (error) => {
        console.log(error);
      },
    })
  }

  /**
   * help function for addVMeter()
   * @returns a list of all ids which are inside the virtual meter
   */
  createSubMeterList(selectedMeters: any): Object {

    let id_list: string[] = [];

    selectedMeters.forEach((item: { id: string; }) => {
      id_list.push(item.id);
    });

    return { submeterIds: id_list }
  }

  /**
   * delete a virtual meter
   * @param id  name of virtual meter, which functions as it's id
   * @param index index of meter in arr, to hotreload page
   */
  deleteVMeterById(id: string, index: number): void {
    if (this.isDeleting) {
      return;
    }

    // flag true aslong as deletion is processed)
    this.isDeleting = true;

    let tmp = this.vMeters.splice(index, 1);

    console.log(tmp);

    this.bwsService.delVirtualMeterById(id).subscribe({
      next: (response) => {
        if (response && response.hasOwnProperty('msg')) {
          this.vMeters.push(tmp[0]);
          alert("Virtual Meter with Name " + id + " not found and can not be deleted!");
        }
      },
      error: (error) => {
        console.log(error);
      },
      complete: () => {
        this.isDeleting = false;
      }
    })
  }

  // ---------- Algorithm Functions ----------

  /**
   * train one of the Models and retrieve the training data
   */
  trainModel(): void {

    if (!this.selectedVirtualMeter) {
      console.log("No Virtual Meter detected!");
      return;
    }

    if (!this.selectedAlgorithm) {
      console.log("No algorithm detected!");
      return;
    }

    if (!this.modelComment) {
      alert("a comment is necessary!");
      return;
    }

    this.bwsService.putTrainModel(this.selectedVirtualMeter, this.selectedAlgorithm, this.modelComment).subscribe({
      next: (response) => {
        this.extractModels();
        this.selectedAlgorithm = undefined;
        this.selectedVirtualMeter = undefined;
        this.modelComment = undefined;
      },
      error: (error) => {
        console.log(error);
      },
    })
  }

  /**
   * delete a model from database using bws service
   * @param vMeterId id of virtual meter the model is trained on
   * @param algId id of algorithm which got used to train model
   * @param index place in list to correctly remove model afterwards
   */
  deleteModel(vMeterId: string, algId: string, index: number): void {
    if (this.isDeleting) {
      return;
    }

    this.isDeleting = true;

    let tmp = this.models.splice(index, 1);

    this.bwsService.delModel(vMeterId, algId).subscribe({
      next: (response) => {
        if (response && response.hasOwnProperty('message')) {
          this.models.push(tmp[0]);
          alert("Model not found");
        }
      },
      error: (error) => {
        console.log(error);
      },
      complete: () => {
        this.isDeleting = false;
      }
    })
  }

  // ---------- Forecast Creation -----------

  /**
   * create forecast by receiving data from api and displaying it in a graph
   * @returns if a value for the api request is missing
   */
  getForecast(): void {

    if (!this.selectedModel) {
      alert("No model chosen");
      return;
    }

    let vMeterId = this.selectedModel.refMeter;
    let algId = this.selectedModel.algorithm;

    this.bwsService.getCreateForecast(vMeterId, algId).subscribe({
      next: (response) => {
        if (response.hasOwnProperty('msg')) {
          console.log(response);
        } else {

          let predValues = response.map((item) => item.numValue);

          let date = response[0].datePredicted;

          let label = this.transformString(vMeterId, this.prefixes[0]) + " " + algId + " " + this.transformDate(date)

          this.addGraphToChart(predValues, label)
        }
      },
      error: (error) => {
        console.log(error);
      },
      complete: () => {
        this.selectedModel = undefined;
      }
    })
  }

  /**
   * Function to add new lines dynamically to the graph
   * @param label new data label
   * @param dataPoints the new prediction values
   * @param borderColor color to use
   */
  addGraphToChart(dataPoints: number[], label: string): void {
    // Create a new dataset
    const newDataset: ChartDataset<'line'> = {
      label: label,
      data: dataPoints,
      borderColor: this.generateRandomColor(),
      fill: false,
    };

    // Add the new dataset to the existing chart data
    this.chartData.datasets.push(newDataset);

    // Update the chart to reflect the changes
    if (this.chart) {
      this.chart.update();
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

  // ---------- Utility Functions ----------

  /**
   * pipe implementation to clean the ids from the smart meters
   * @param value the whole string to change
   * @param removable the string to remove
   * @returns the tidied up string
   */
  transformString(value: string, removable: string): string {
    let t = new TransformStringPipe();
    return t.transform(value, removable)
  }

  /**
   * pipe implementation to clean a date to readable format
   * @param date initial date
   * @param format format to use
   * @returns the new date as a string
   */
  transformDate(date: string): string {

    const datePipe = new DatePipe('en-US');

    const formattedDate = datePipe.transform(date, 'dd.MM.yyyy');

    return formattedDate || date;
  }
}

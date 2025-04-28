import {Pipe, PipeTransform} from "@angular/core";

@Pipe({name: "empty"})
export class EmptyPipe implements PipeTransform {
  transform(value: null): true;
  transform(value: undefined): true;
  transform(value?: string): boolean;
  transform(value?: any[]): boolean;
  transform(value?: object): boolean;
  transform(value: unknown, ..._args: unknown[]): unknown {
    if (value === null) return true;
    if (value === undefined) return true;
    if (typeof value === "string") return !value;
    if (Array.isArray(value)) return !value.length;
    if (typeof value === "object") return !Object.values(value).length;
    return null;
  }
}

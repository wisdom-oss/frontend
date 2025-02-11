import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'transformString'
})
export class TransformStringPipe implements PipeTransform {

  transform(value: string, search: string): string {
    if (!value || !search) {
      return value; // Return original value if no search string is provided
    }
    const regex = new RegExp(search, 'g'); // Create a regex to match the search string globally
    return value.replace(regex, ''); // Replace the matched string with nothing
  }
}
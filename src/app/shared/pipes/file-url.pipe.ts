import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '@env';

@Pipe({ name: 'fileUrl', standalone: true })
export class FileUrlPipe implements PipeTransform {
  transform(filePath: string | null | undefined): string {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath;
    const base = environment.apiUrl.replace(/\/+$/, '');
    const path = filePath.replace(/^\/+/, '');
    return `${base}/${path}`;
  }
}

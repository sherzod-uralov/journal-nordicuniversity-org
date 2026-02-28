import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Volume } from '@core/models/volume.model';
import { FileUrlPipe } from '@shared/pipes/file-url.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'app-volume-card',
  standalone: true,
  imports: [RouterLink, DatePipe, FileUrlPipe, TranslatePipe],
  templateUrl: './volume-card.component.html',
  styleUrl: './volume-card.component.css',
})
export class VolumeCardComponent {
  readonly volume = input.required<Volume>();
}

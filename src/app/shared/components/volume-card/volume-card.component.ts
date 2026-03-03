import { Component, input , ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Volume } from '@core/models/volume.model';
import { ImageComponent } from '@shared/components/image/image.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'app-volume-card',
  standalone: true,
  imports: [RouterLink, DatePipe, ImageComponent, TranslatePipe],
  templateUrl: './volume-card.component.html',
  styleUrl: './volume-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VolumeCardComponent {
  readonly volume = input.required<Volume>();
}

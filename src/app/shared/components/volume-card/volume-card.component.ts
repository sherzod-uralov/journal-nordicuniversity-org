import { Component, input , ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Volume } from '@core/models/volume.model';
import { ImageComponent } from '@shared/components/image/image.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { DateLocalePipe } from '@shared/pipes/date-locale.pipe';

@Component({
  selector: 'app-volume-card',
  standalone: true,
  imports: [RouterLink, ImageComponent, TranslatePipe, DateLocalePipe],
  templateUrl: './volume-card.component.html',
  styleUrl: './volume-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VolumeCardComponent {
  readonly volume = input.required<Volume>();
}

import { Component , ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'app-edit-article',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './edit-article.component.html',
  styleUrl: './edit-article.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditArticleComponent {}

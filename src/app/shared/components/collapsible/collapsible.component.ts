import { Component, input, signal, contentChild, TemplateRef, OnInit , ChangeDetectionStrategy } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'app-collapsible',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './collapsible.component.html',
  styleUrl: './collapsible.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollapsibleComponent implements OnInit {
  readonly title = input.required<string>();
  readonly open = input(false);
  readonly icon = contentChild<TemplateRef<unknown>>('icon');

  readonly expanded = signal(false);

  ngOnInit(): void {
    this.expanded.set(this.open());
  }

  toggle(): void {
    this.expanded.update(v => !v);
  }
}

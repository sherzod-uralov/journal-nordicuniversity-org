import {
  Component, forwardRef, input, signal, computed,
  ChangeDetectionStrategy, ElementRef, inject, HostListener, OnDestroy,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

interface CalendarDay {
  day: number;
  date: Date;
  currentMonth: boolean;
  today: boolean;
  selected: boolean;
  disabled: boolean;
}

@Component({
  selector: 'app-datepicker',
  standalone: true,
  templateUrl: './datepicker.component.html',
  styleUrl: './datepicker.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DatepickerComponent),
    multi: true,
  }],
})
export class DatepickerComponent implements ControlValueAccessor, OnDestroy {
  readonly placeholder = input('yyyy-mm-dd');
  readonly minDate = input<Date | null>(null);
  readonly maxDate = input<Date | null>(null);

  private readonly el = inject(ElementRef);
  private readonly doc = inject(DOCUMENT);

  readonly isOpen = signal(false);
  readonly selected = signal<Date | null>(null);
  readonly isDisabled = signal(false);
  readonly viewMonth = signal(new Date().getMonth());
  readonly viewYear = signal(new Date().getFullYear());
  readonly panelPos = signal({ top: 0, left: 0, width: 220 });

  private scrollCleanup: (() => void) | null = null;
  private onChange: (v: Date | null) => void = () => {};
  private onTouched: () => void = () => {};

  readonly DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  readonly displayValue = computed(() => {
    const d = this.selected();
    if (!d) return '';
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });

  readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(
      new Date(this.viewYear(), this.viewMonth())
    )
  );

  readonly weeks = computed<CalendarDay[][]>(() => {
    const y = this.viewYear();
    const m = this.viewMonth();
    const sel = this.selected();
    const min = this.minDate();
    const max = this.maxDate();
    const now = new Date();

    const first = new Date(y, m, 1);
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const startDow = (first.getDay() + 6) % 7;
    const prevLast = new Date(y, m, 0).getDate();

    const cells: CalendarDay[] = [];

    for (let i = startDow - 1; i >= 0; i--) {
      const day = prevLast - i;
      cells.push(this.mkDay(day, new Date(y, m - 1, day), false, sel, min, max, now));
    }

    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(this.mkDay(d, new Date(y, m, d), true, sel, min, max, now));
    }

    const rem = (7 - cells.length % 7) % 7;
    for (let d = 1; d <= rem; d++) {
      cells.push(this.mkDay(d, new Date(y, m + 1, d), false, sel, min, max, now));
    }

    const weeks: CalendarDay[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  });

  @HostListener('document:mousedown', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (this.isOpen() && event.target && !this.el.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  toggle(): void {
    if (this.isDisabled()) return;
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
    this.onTouched();
  }

  prevMonth(): void {
    if (this.viewMonth() === 0) {
      this.viewMonth.set(11);
      this.viewYear.update(y => y - 1);
    } else {
      this.viewMonth.update(m => m - 1);
    }
  }

  nextMonth(): void {
    if (this.viewMonth() === 11) {
      this.viewMonth.set(0);
      this.viewYear.update(y => y + 1);
    } else {
      this.viewMonth.update(m => m + 1);
    }
  }

  pick(d: CalendarDay): void {
    if (d.disabled) return;
    this.selected.set(d.date);
    this.onChange(d.date);
    this.onTouched();
    this.close();
  }

  goToday(): void {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    if (this.isOutOfRange(t, this.minDate(), this.maxDate())) return;
    this.selected.set(t);
    this.viewMonth.set(t.getMonth());
    this.viewYear.set(t.getFullYear());
    this.onChange(t);
    this.onTouched();
    this.close();
  }

  clear(e: Event): void {
    e.stopPropagation();
    this.selected.set(null);
    this.onChange(null);
    this.close();
  }

  ngOnDestroy(): void {
    this.stopScrollListener();
  }

  writeValue(val: Date | null): void {
    this.selected.set(val);
    if (val) {
      this.viewMonth.set(val.getMonth());
      this.viewYear.set(val.getFullYear());
    }
  }

  registerOnChange(fn: (v: Date | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.isDisabled.set(d); }

  private open(): void {
    this.calcPosition();
    this.isOpen.set(true);
    this.startScrollListener();
    const s = this.selected();
    if (s) {
      this.viewMonth.set(s.getMonth());
      this.viewYear.set(s.getFullYear());
    }
  }

  private close(): void {
    this.isOpen.set(false);
    this.stopScrollListener();
  }

  private calcPosition(): void {
    const input = this.el.nativeElement.querySelector('.dp-input') as HTMLElement;
    if (!input) return;
    const rect = input.getBoundingClientRect();
    const panelH = 290;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const spaceBelow = vh - rect.bottom;
    const above = spaceBelow < panelH && rect.top > panelH;
    this.panelPos.set({
      top: above ? rect.top - panelH - 4 : rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 220),
    });
  }

  private startScrollListener(): void {
    const handler = () => this.close();
    this.doc.addEventListener('scroll', handler, true);
    this.scrollCleanup = () => this.doc.removeEventListener('scroll', handler, true);
  }

  private stopScrollListener(): void {
    this.scrollCleanup?.();
    this.scrollCleanup = null;
  }

  private mkDay(
    day: number, date: Date, currentMonth: boolean,
    sel: Date | null, min: Date | null, max: Date | null, now: Date,
  ): CalendarDay {
    return {
      day, date, currentMonth,
      today: this.same(date, now),
      selected: sel ? this.same(date, sel) : false,
      disabled: this.isOutOfRange(date, min, max),
    };
  }

  private isOutOfRange(date: Date, min: Date | null, max: Date | null): boolean {
    const t = this.ts(date);
    return (min != null && t < this.ts(min)) || (max != null && t > this.ts(max));
  }

  private same(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  private ts(d: Date): number {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

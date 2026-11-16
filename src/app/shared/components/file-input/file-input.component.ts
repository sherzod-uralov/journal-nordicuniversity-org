import { Component, forwardRef, input, signal, output, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LanguageService } from '@core/services/language.service';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'app-file-input',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './file-input.component.html',
  styleUrl: './file-input.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FileInputComponent),
      multi: true,
    },
  ],
})
export class FileInputComponent implements ControlValueAccessor {
  readonly accept = input<string>('');
  readonly maxSize = input<number>(10); // MB
  readonly label = input<string>('Choose file');
  readonly hint = input<string>('');

  readonly file = signal<File | null>(null);
  readonly isDragging = signal(false);
  readonly isDisabled = signal(false);
  private readonly languageService = inject(LanguageService);

  /** i18n key + params, translated at render time so it follows language switches. */
  readonly error = signal<{ key: string; params: Record<string, string> } | null>(null);
  readonly errorText = computed(() => {
    const e = this.error();
    return e ? this.format(e.key, e.params) : '';
  });
  readonly maxSizeText = computed(() => this.format('file_input.max_size', { size: String(this.maxSize()) }));

  readonly fileSelected = output<File>();

  private onChange: (val: File | null) => void = () => {};
  private onTouched: () => void = () => {};

  get fileName(): string {
    return this.file()?.name ?? '';
  }

  get fileSize(): string {
    const f = this.file();
    if (!f) return '';
    const kb = f.size / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }

  get fileIcon(): string {
    const f = this.file();
    if (!f) return '';
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'doc';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return 'image';
    return 'file';
  }

  get acceptHint(): string {
    const a = this.accept();
    if (!a) return '';
    return a.split(',').map(s => s.trim().replace('.', '').toUpperCase()).join(', ');
  }

  writeValue(val: File | null): void {
    this.file.set(val);
  }

  registerOnChange(fn: (val: File | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.isDisabled.set(disabled);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isDisabled()) this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    if (this.isDisabled()) return;
    const files = event.dataTransfer?.files;
    if (files?.length) this.processFile(files[0]);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.processFile(input.files[0]);
      input.value = '';
    }
  }

  remove(): void {
    this.file.set(null);
    this.error.set(null);
    this.onChange(null);
  }

  private processFile(file: File): void {
    this.error.set(null);

    // Check accept
    if (this.accept()) {
      const accepted = this.accept().split(',').map(s => s.trim().toLowerCase());
      const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '');
      const typeMatch = accepted.some(a =>
        a.startsWith('.') ? a === ext : file.type.startsWith(a.replace('*', ''))
      );
      if (!typeMatch) {
        this.error.set({ key: 'file_input.invalid_type', params: { types: this.acceptHint } });
        return;
      }
    }

    // Check size
    if (file.size > this.maxSize() * 1024 * 1024) {
      this.error.set({ key: 'file_input.too_large', params: { size: String(this.maxSize()) } });
      return;
    }

    this.file.set(file);
    this.onChange(file);
    this.fileSelected.emit(file);
    this.onTouched();
  }

  private format(key: string, params: Record<string, string>): string {
    return Object.entries(params).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, value),
      this.languageService.translate(key),
    );
  }
}

import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy, DestroyRef, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ArticleApiService } from '@services/api/article-api.service';
import { FileApiService } from '@services/api/file-api.service';
import { CategoryApiService } from '@services/api/category-api.service';
import { SubcategoryApiService } from '@services/api/subcategory-api.service';
import { Category, SubCategory } from '@core/models/category.model';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { UiStore } from '@store/ui.store';
import { AuthStore } from '@store/auth.store';
import { TextInputComponent } from '@shared/components/text-input/text-input.component';
import { TextareaInputComponent } from '@shared/components/textarea-input/textarea-input.component';
import { SelectInputComponent } from '@shared/components/select-input/select-input.component';
import { FileInputComponent } from '@shared/components/file-input/file-input.component';
import { TagInputComponent } from '@shared/components/tag-input/tag-input.component';
import { ErrorStateComponent } from '@shared/components/error-state/error-state.component';

@Component({
  selector: 'app-submit-article',
  standalone: true,
  imports: [
    FormsModule,
    FormFieldComponent,
    TranslatePipe,
    TextInputComponent,
    TextareaInputComponent,
    SelectInputComponent,
    FileInputComponent,
    TagInputComponent,
    ErrorStateComponent,
  ],
  templateUrl: './submit-article.component.html',
  styleUrl: './submit-article.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubmitArticleComponent implements OnInit {
  private readonly articleApi = inject(ArticleApiService);
  private readonly fileApi = inject(FileApiService);
  private readonly categoryApi = inject(CategoryApiService);
  private readonly subcategoryApi = inject(SubcategoryApiService);
  private readonly router = inject(Router);
  private readonly uiStore = inject(UiStore);
  private readonly authStore = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly categories = signal<Category[]>([]);
  readonly allSubcategories = signal<SubCategory[]>([]);
  readonly categoriesError = signal(false);
  readonly loading = signal(false);
  readonly errors = signal<Record<string, string | undefined>>({});

  title = '';
  abstract = '';
  description = '';
  keywords = signal<string[]>([]);
  referenceItems = signal<string[]>([]);
  selectedCategory = signal<number | null>(null);
  selectedSubcategory = signal<number | null>(null);

  readonly articleFile = signal<File | null>(null);
  readonly imageFile = signal<File | null>(null);
  readonly articleFileId = signal<string | null>(null);
  readonly imageFileId = signal<string | null>(null);
  readonly uploadingArticle = signal(false);
  readonly uploadingImage = signal(false);
  private articleUpload: Subscription | null = null;
  private imageUpload: Subscription | null = null;

  readonly filteredSubcategories = computed(() => {
    const catId = this.selectedCategory();
    if (!catId) return [];
    return this.allSubcategories().filter(s => s.categoryId === catId && s.name);
  });

  readonly categoryOptions = computed(() =>
    this.categories().filter(c => c.name).map(c => ({ value: c.id, label: c.name }))
  );

  readonly subcategoryOptions = computed(() =>
    this.filteredSubcategories().map(s => ({ value: s.id, label: s.name }))
  );

  ngOnInit(): void {
    if (!this.authStore.profile()) {
      this.authStore.loadProfile();
    }
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoriesError.set(false);
    this.categoryApi.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: c => this.categories.set(c),
      error: () => this.categoriesError.set(true),
    });
    this.subcategoryApi.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: s => this.allSubcategories.set(s),
      error: () => this.categoriesError.set(true),
    });
  }

  onCategoryChange(val: number | null): void {
    this.selectedCategory.set(val);
    this.selectedSubcategory.set(null);
  }

  onArticleFileChange(file: File | null): void {
    this.articleUpload?.unsubscribe();
    this.articleUpload = this.startUpload(file, this.articleFile, this.articleFileId, this.uploadingArticle);
  }

  onImageFileChange(file: File | null): void {
    this.imageUpload?.unsubscribe();
    this.imageUpload = this.startUpload(file, this.imageFile, this.imageFileId, this.uploadingImage);
  }

  /**
   * Uploads `file` and stores its id. The caller cancels the previous upload first,
   * so a stale response can never overwrite the id of a newer (or removed) file.
   */
  private startUpload(
    file: File | null,
    fileSig: WritableSignal<File | null>,
    idSig: WritableSignal<string | null>,
    uploadingSig: WritableSignal<boolean>,
  ): Subscription | null {
    fileSig.set(file);
    idSig.set(null);
    uploadingSig.set(false);
    if (!file) return null;

    uploadingSig.set(true);
    return this.fileApi.upload(file).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        idSig.set(res.id);
        uploadingSig.set(false);
        this.uiStore.addToast('cabinet.submit.file_uploaded', 'success');
      },
      error: () => {
        uploadingSig.set(false);
        fileSig.set(null);
        this.uiStore.addToast('cabinet.submit.error.upload_failed', 'error');
      },
    });
  }

  validate(): boolean {
    const errs: Record<string, string> = {};

    if (!this.title || this.title.trim().length < 3 || this.title.trim().length > 500) {
      errs['title'] = 'cabinet.submit.error.title';
    }
    if (!this.abstract || this.abstract.trim().length < 10 || this.abstract.trim().length > 2000) {
      errs['abstract'] = 'cabinet.submit.error.abstract';
    }
    if (!this.description || this.description.trim().length < 3 || this.description.trim().length > 50000) {
      errs['description'] = 'cabinet.submit.error.description';
    }
    if (this.keywords().length === 0 || this.keywords().length > 20 || this.keywords().some(k => k.length > 100)) {
      errs['keywords'] = 'cabinet.submit.error.keywords';
    }
    if (!this.selectedCategory()) {
      errs['categoryId'] = 'cabinet.submit.error.category';
    }
    if (!this.selectedSubcategory()) {
      errs['subcategoryId'] = 'cabinet.submit.error.subcategory';
    }
    if (!this.articleFileId()) {
      errs['articleFile'] = 'cabinet.submit.error.file';
    }

    this.errors.set(errs);
    return Object.keys(errs).length === 0;
  }

  submit(): void {
    if (!this.validate()) return;

    const profile = this.authStore.profile();
    if (!profile) {
      this.uiStore.addToast('common.error', 'error');
      return;
    }

    this.loading.set(true);

    const body: Record<string, unknown> = {
      author_id: profile.id,
      title: this.title,
      abstract: this.abstract,
      description: this.description,
      keyword: this.keywords().join(','),
      categoryId: this.selectedCategory(),
      SubCategoryId: this.selectedSubcategory(),
      source_id: this.articleFileId(),
    };

    if (this.imageFileId()) body['image_id'] = this.imageFileId();
    if (this.referenceItems().length > 0) {
      // One reference per line — references themselves contain commas.
      body['references'] = this.referenceItems().join('\n');
    }

    this.articleApi.create(body).subscribe({
      next: () => {
        this.uiStore.addToast('cabinet.submit.success', 'success');
        this.router.navigate(['/cabinet/articles']);
      },
      error: () => {
        this.uiStore.addToast('cabinet.submit.error.failed', 'error');
        this.loading.set(false);
      },
    });
  }
}

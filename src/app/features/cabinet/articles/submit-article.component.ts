import { Component, inject, OnInit, signal, computed } from '@angular/core';
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
  ],
  templateUrl: './submit-article.component.html',
  styleUrl: './submit-article.component.css',
})
export class SubmitArticleComponent implements OnInit {
  private readonly articleApi = inject(ArticleApiService);
  private readonly fileApi = inject(FileApiService);
  private readonly categoryApi = inject(CategoryApiService);
  private readonly subcategoryApi = inject(SubcategoryApiService);
  private readonly router = inject(Router);
  private readonly uiStore = inject(UiStore);
  private readonly authStore = inject(AuthStore);

  readonly categories = signal<Category[]>([]);
  readonly allSubcategories = signal<SubCategory[]>([]);
  readonly loading = signal(false);
  readonly errors = signal<Record<string, string>>({});

  title = '';
  abstract = '';
  description = '';
  keywords = signal<string[]>([]);
  referenceItems = signal<string[]>([]);
  selectedCategory = signal<number | null>(null);
  selectedSubcategory = signal<number | null>(null);

  articleFile: File | null = null;
  imageFile: File | null = null;
  readonly articleFileId = signal<string | null>(null);
  readonly imageFileId = signal<string | null>(null);
  readonly uploadingArticle = signal(false);
  readonly uploadingImage = signal(false);

  readonly filteredSubcategories = computed(() => {
    const catId = this.selectedCategory();
    if (!catId) return [];
    return this.allSubcategories().filter(s => s.categoryId === catId);
  });

  get categoryOptions() {
    return this.categories().map(c => ({ value: c.id, label: c.name }));
  }

  get subcategoryOptions() {
    return this.filteredSubcategories().map(s => ({ value: s.id, label: s.name }));
  }

  ngOnInit(): void {
    if (!this.authStore.profile()) {
      this.authStore.loadProfile();
    }
    this.categoryApi.getAll().subscribe(c => this.categories.set(c));
    this.subcategoryApi.getAll().subscribe(s => this.allSubcategories.set(s));
  }

  onCategoryChange(val: number | null): void {
    this.selectedCategory.set(val);
    this.selectedSubcategory.set(null);
  }

  onArticleFileChange(file: File | null): void {
    this.articleFile = file;
    this.articleFileId.set(null);
    if (file) {
      this.uploadingArticle.set(true);
      this.fileApi.upload(file).subscribe({
        next: (res) => {
          this.articleFileId.set(res.id);
          this.uploadingArticle.set(false);
          this.uiStore.addToast('cabinet.submit.file_uploaded', 'success');
        },
        error: () => {
          this.uploadingArticle.set(false);
          this.uiStore.addToast('cabinet.submit.error.upload_failed', 'error');
          this.articleFile = null;
        },
      });
    }
  }

  onImageFileChange(file: File | null): void {
    this.imageFile = file;
    this.imageFileId.set(null);
    if (file) {
      this.uploadingImage.set(true);
      this.fileApi.upload(file).subscribe({
        next: (res) => {
          this.imageFileId.set(res.id);
          this.uploadingImage.set(false);
          this.uiStore.addToast('cabinet.submit.file_uploaded', 'success');
        },
        error: () => {
          this.uploadingImage.set(false);
          this.uiStore.addToast('cabinet.submit.error.upload_failed', 'error');
          this.imageFile = null;
        },
      });
    }
  }

  validate(): boolean {
    const errs: Record<string, string> = {};

    if (!this.title || this.title.trim().length < 3) {
      errs['title'] = 'cabinet.submit.error.title';
    }
    if (!this.abstract || this.abstract.trim().length < 10) {
      errs['abstract'] = 'cabinet.submit.error.abstract';
    }
    if (!this.description || this.description.trim().length < 3) {
      errs['description'] = 'cabinet.submit.error.description';
    }
    if (this.keywords().length === 0) {
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
      body['references'] = this.referenceItems().join(', ');
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

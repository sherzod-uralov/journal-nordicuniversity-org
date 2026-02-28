import { FileUpload } from './file-upload.model';

export interface Category {
  id: number;
  name: string;
  file_id: string;
  file?: FileUpload;
  subCategories?: SubCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryShort {
  id: number;
  name: string;
}

export interface SubCategory {
  id: number;
  name: string;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubCategoryShort {
  id: number;
  name: string;
}

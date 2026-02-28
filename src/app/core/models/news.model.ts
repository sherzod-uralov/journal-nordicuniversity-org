import { FileUpload } from './file-upload.model';

export interface News {
  id: string;
  source_id: string;
  source?: FileUpload;
  news_title_uz: string;
  news_title_ru: string;
  news_title_en: string;
  slug_uz: string;
  slug_ru: string;
  slug_en: string;
  news_time: string;
  news_data: number;
  news_hashtags: string;
  news_description_uz: string;
  news_description_ru: string;
  news_description_en: string;
  news_body_uz: string;
  news_body_ru: string;
  news_body_en: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

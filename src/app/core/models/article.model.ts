import { AuthorShort } from './author.model';
import { CategoryShort, SubCategoryShort } from './category.model';
import { FileUpload } from './file-upload.model';
import { VolumeShort } from './volume.model';

export type ArticleStatus = 'NEW' | 'PLAGIARISM' | 'REVIEW' | 'PAYMENT' | 'ACCEPT' | 'REJECTED';

export interface Article {
  id: string;
  author_id: string;
  author?: AuthorShort;
  categoryId: number;
  category?: CategoryShort;
  SubCategoryId: number;
  SubCategory?: SubCategoryShort;
  plagiarist_file_id: string | null;
  plagiarist_file?: FileUpload;
  review_file_id: string | null;
  review_file?: FileUpload;
  source_id: string;
  file?: FileUpload;
  image_id: string | null;
  image?: FileUpload;
  title: string;
  abstract: string;
  description: string;
  keyword: string;
  doi: string | null;
  slug: string;
  tg_source: string | null;
  status: ArticleStatus;
  last_status: ArticleStatus;
  reason_for_rejection: string | null;
  viewsCount: number;
  volume_id: number | null;
  volume?: VolumeShort;
  publish_date: string | null;
  transaction_id: number | null;
  references: string | null;
  first_page_in_volume: number | null;
  last_page_in_volume: number | null;
  isPaid: boolean;
  coAuthors?: AuthorShort[];
  transaction?: {
    transactions_link: {
      click_link: string;
      payme_link: string;
    };
    amount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MultiArticlesResponse {
  articles: Article[];
  topArticles: Article[];
  lastArticles: Article[];
}

export interface ArticleFilterBody {
  mainFilter?: {
    title?: string;
    volume?: number[];
    subCategory?: number[];
    Category?: number[];
    author?: string[];
  };
  extraFilter?: {
    existDoi?: boolean;
  };
  dateFilter?: {
    start?: string;
    end?: string;
  };
  sort?: {
    createdAt?: 'ASC' | 'DESC';
    viewsCount?: 'ASC' | 'DESC';
  };
}

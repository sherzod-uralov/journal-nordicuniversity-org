import { FileUpload } from './file-upload.model';

export interface Volume {
  id: number;
  title: string;
  text: string;
  description: string;
  image_id: string;
  image?: FileUpload;
  source_id: string;
  source?: FileUpload;
  articleCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface VolumeShort {
  id: number;
  title: string;
}

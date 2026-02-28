import { FileUpload } from './file-upload.model';

export interface Director {
  id: string;
  full_name: string;
  position: string;
  identity: string;
  image_id: string;
  resume_file_id: string | null;
  order: number;
  image?: FileUpload;
  resume_file?: FileUpload;
  createdAt: string;
  updatedAt: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
}

export interface Info {
  id: number;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: string;
  full_name: string;
  direction: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

export interface AboutAll {
  info?: Info;
  directors?: Director[];
  faqs?: Faq[];
  members?: Member[];
}

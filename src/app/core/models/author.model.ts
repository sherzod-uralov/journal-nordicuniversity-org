import { FileUpload } from './file-upload.model';

export interface Author {
  id: string;
  full_name: string;
  science_degree: string;
  phone_number: string;
  birthday: string;
  job: string;
  OrcID: string;
  place_position: string;
  source_id: string | null;
  file?: FileUpload;
  createdAt: string;
  updatedAt: string;
}

export interface AuthorShort {
  id: string;
  full_name: string;
  phone_number: string;
  science_degree: string;
  job: string;
  OrcID: string | null;
  place_position: string;
  birthday?: string;
}

export interface AuthorLoginResponse {
  message: string;
  login_data: {
    ExistAuthor: Author;
    token: string;
  };
}

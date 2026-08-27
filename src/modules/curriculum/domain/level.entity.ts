export enum ContentStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

export interface Level {
  id: string;
  title: string;
  slug: string;
  description: string;
  sortOrder: number;
  status: ContentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLevelInput {
  title: string;
  slug: string;
  description: string;
  sortOrder: number;
  status: ContentStatus;
}

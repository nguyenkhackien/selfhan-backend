import { ContentStatus } from "./level.entity";

export interface Unit {
  id: string;
  levelId: string;
  title: string;
  slug: string;
  description: string;
  sortOrder: number;
  status: ContentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUnitInput {
  levelId: string;
  title: string;
  slug: string;
  description: string;
  sortOrder: number;
  status: ContentStatus;
}

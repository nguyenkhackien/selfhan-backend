import { ContentStatus } from "./level.entity";

export interface Lesson {
  id: string;
  unitId: string;
  title: string;
  slug: string;
  summary: string | null;
  writingCharacter: string | null;
  sortOrder: number;
  status: ContentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLessonInput {
  unitId: string;
  title: string;
  slug: string;
  summary: string | null;
  writingCharacter: string | null;
  sortOrder: number;
  status: ContentStatus;
}

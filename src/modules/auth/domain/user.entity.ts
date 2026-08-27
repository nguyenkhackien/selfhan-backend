export enum UserRole {
  LEARNER = "learner",
  ADMIN = "admin",
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

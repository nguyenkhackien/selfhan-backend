export interface RefreshSession {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface CreateRefreshSessionInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface RefreshSessionResponse {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

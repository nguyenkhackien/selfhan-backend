import { Injectable, NotFoundException } from "@nestjs/common";
import { UserRepositoryPort } from "./auth.ports";
import { UserResponse } from "../domain/user.entity";

export interface GetMeInput {
  userId: string;
}

@Injectable()
export class GetMeUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(input: GetMeInput): Promise<UserResponse> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "User not found.",
      });
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}

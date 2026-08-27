import { Argon2PasswordHasherAdapter } from "./argon2-password-hasher.adapter";

describe("Argon2PasswordHasherAdapter", () => {
  let adapter: Argon2PasswordHasherAdapter;

  beforeEach(() => {
    adapter = new Argon2PasswordHasherAdapter();
  });

  describe("hash", () => {
    it("should hash a password with argon2id", async () => {
      const password = "test-password-123";
      const hash = await adapter.hash(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
      expect(hash).not.toBe(password);
      expect(hash).toContain("$argon2id$");
    });

    it("should produce different hashes for the same password", async () => {
      const password = "test-password-123";
      const hash1 = await adapter.hash(password);
      const hash2 = await adapter.hash(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verify", () => {
    it("should verify a correct password against its hash", async () => {
      const password = "test-password-123";
      const hash = await adapter.hash(password);

      const result = await adapter.verify(password, hash);

      expect(result).toBe(true);
    });

    it("should reject an incorrect password", async () => {
      const password = "test-password-123";
      const wrongPassword = "wrong-password-456";
      const hash = await adapter.hash(password);

      const result = await adapter.verify(wrongPassword, hash);

      expect(result).toBe(false);
    });
  });
});

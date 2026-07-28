// Backend/src/types/paseto-ts.d.ts

declare module "paseto-ts" {
  /**
   * Encrypts a payload into a PASETO token.
   */
  export function encrypt(
    key: string,
    payload: Record<string, unknown>
  ): Promise<string>;

  /**
   * Decrypts a PASETO token back into its payload.
   */
  export function decrypt(
    key: string,
    token: string
  ): Promise<{ payload: unknown }>;
}
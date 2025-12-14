import * as bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export async function hashAccessCode(accessCode: string): Promise<string> {
  return await bcrypt.hash(accessCode, SALT_ROUNDS);
}

export async function verifyAccessCode(
  accessCode: string,
  hash: string,
): Promise<boolean> {
  return await bcrypt.compare(accessCode, hash);
}

export function generateAccessCode(length: number = 16): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

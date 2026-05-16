import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { safeQuery, isDbConnectionError } from "./db-safe";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createAdmin(data: {
  name: string;
  email: string;
  password: string;
  role?: string;
}) {
  const hashed = await hashPassword(data.password);
  return prisma.admin.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: hashed,
      role: data.role || "Manager",
    },
  });
}

export async function verifyAdmin(email: string, password: string) {
  const admin = await safeQuery(
    async () => prisma.admin.findUnique({ where: { email } }),
    null
  );
  if (!admin) return null;
  const valid = await verifyPassword(password, admin.passwordHash);
  if (!valid) return null;
  return admin;
}

export function checkDbConnectionError(err: unknown): boolean {
  return isDbConnectionError(err);
}

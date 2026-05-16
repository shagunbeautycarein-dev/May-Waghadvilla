import { prisma } from "./prisma";

export async function verifyOnboardingToken(token: string) {
  const record = await prisma.onboardingToken.findUnique({
    where: { token },
    include: {
      guest: {
        include: {
          room: true,
          bed: true,
          onboardingData: true,
        },
      },
    },
  });

  if (!record) return null;
  if (record.used) return null;
  if (record.expiresAt < new Date()) return null;

  return record;
}

export async function markTokenUsed(token: string) {
  return prisma.onboardingToken.update({
    where: { token },
    data: { used: true },
  });
}

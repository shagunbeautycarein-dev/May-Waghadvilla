import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create Super Admin
  const hashedPassword = await bcrypt.hash("admin123", 12);
  await prisma.admin.upsert({
    where: { email: "admin@wahadvilla.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@wahadvilla.com",
      passwordHash: hashedPassword,
      role: "Super Admin",
    },
  });

  // Create floors
  const groundFloor = await prisma.floor.create({
    data: { name: "Ground Floor", sortOrder: 1 },
  });
  const firstFloor = await prisma.floor.create({
    data: { name: "First Floor", sortOrder: 2 },
  });
  const secondFloor = await prisma.floor.create({
    data: { name: "Second Floor", sortOrder: 3 },
  });

  // Create rooms
  const room101 = await prisma.room.create({
    data: {
      floorId: groundFloor.id,
      name: "101",
      sharingType: "3-sharing",
      acType: "AC",
      mealsIncluded: true,
      electricityIncluded: false,
      wifiName: "Wahad_Villa_101",
      wifiPassword: "welcome2026",
      amenities: ["WiFi", "AC", "Wardrobe", "Attached Bathroom", "Balcony"],
      images: [],
      description: "Spacious 3-sharing AC room with attached bathroom and balcony. Perfect for students and working professionals.",
    },
  });

  const room102 = await prisma.room.create({
    data: {
      floorId: groundFloor.id,
      name: "102",
      sharingType: "2-sharing",
      acType: "AC",
      mealsIncluded: true,
      electricityIncluded: false,
      wifiName: "Wahad_Villa_102",
      wifiPassword: "welcome2026",
      amenities: ["WiFi", "AC", "Wardrobe", "Attached Bathroom", "TV"],
      images: [],
      description: "Premium 2-sharing AC room with TV and modern furnishings.",
    },
  });

  const room201 = await prisma.room.create({
    data: {
      floorId: firstFloor.id,
      name: "201",
      sharingType: "1-sharing",
      acType: "AC",
      mealsIncluded: false,
      electricityIncluded: false,
      wifiName: "Wahad_Villa_201",
      wifiPassword: "welcome2026",
      amenities: ["WiFi", "AC", "Wardrobe", "Attached Bathroom", "Fridge", "TV"],
      images: [],
      description: "Private single room with all premium amenities. Perfect for professionals.",
    },
  });

  // Create beds
  await prisma.bed.createMany({
    data: [
      // Room 101 - 3 sharing
      { roomId: room101.id, name: "A", rent: 9000, deposit: 9000, status: "Available" },
      { roomId: room101.id, name: "B", rent: 9000, deposit: 9000, status: "Available" },
      { roomId: room101.id, name: "C", rent: 9000, deposit: 9000, status: "Available" },
      // Room 102 - 2 sharing
      { roomId: room102.id, name: "A", rent: 12000, deposit: 12000, status: "Available" },
      { roomId: room102.id, name: "B", rent: 12000, deposit: 12000, status: "Available" },
      // Room 201 - 1 sharing
      { roomId: room201.id, name: "A", rent: 18000, deposit: 18000, status: "Available" },
    ],
  });

  // Create default expense categories
  await prisma.expenseCategory.createMany({
    data: [
      { name: "Electricity (building)", color: "#f59e0b" },
      { name: "Water", color: "#0ea5e9" },
      { name: "Staff Salary", color: "#8b5cf6" },
      { name: "Food/Groceries", color: "#10b981" },
      { name: "Maintenance", color: "#ef4444" },
      { name: "Repair", color: "#f97316" },
      { name: "Cleaning Supplies", color: "#06b6d4" },
      { name: "Other", color: "#64748b" },
    ],
    skipDuplicates: true,
  });

  // Create settings
  await prisma.setting.createMany({
    data: [
      { key: "rent_cycle_date", value: "5", category: "onboarding" },
      { key: "advance_rent_count", value: "1", category: "onboarding" },
      { key: "deposit_rule", value: "1 Month Rent", category: "onboarding" },
      { key: "notice_period_days", value: "30", category: "leaving" },
      { key: "grace_days", value: "5", category: "payment" },
      { key: "late_fee", value: "500", category: "payment" },
      { key: "house_rules", value: "1. No smoking inside rooms. 2. Guests allowed until 8 PM. 3. Maintain cleanliness. 4. Lock room when leaving. 5. No loud music after 10 PM.", category: "rules" },
      { key: "terms_and_conditions", value: "By staying at The Wahad Villa, you agree to follow all house rules and policies. Management reserves the right to terminate stay for violations.", category: "rules" },
      { key: "leaving_policy", value: "30 days written notice required. Deposit refunded within 15 days after clearance of all dues and room inspection.", category: "rules" },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Seed completed successfully!");
  console.log("🔑 Admin login: admin@wahadvilla.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

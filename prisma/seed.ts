import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // カテゴリマスタ
  const categories = [
    { id: "chat", displayName: "雑談", sortOrder: 1 },
    { id: "work", displayName: "作業同行", sortOrder: 2 },
    { id: "study", displayName: "勉強", sortOrder: 3 },
    { id: "consult", displayName: "相談", sortOrder: 4 },
    { id: "walk", displayName: "散歩", sortOrder: 5 },
    { id: "sightseeing", displayName: "観光", sortOrder: 6 },
    { id: "event", displayName: "イベント同行", sortOrder: 7 },
    { id: "game", displayName: "ゲーム", sortOrder: 8 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { displayName: cat.displayName, sortOrder: cat.sortOrder },
      create: cat,
    });
  }

  // 対応エリアマスタ（初期: 仙台）
  const areas = [
    {
      name: "sendai",
      displayName: "仙台市",
      lat: 38.2682,
      lng: 140.8694,
      radiusKm: 15.0,
    },
    {
      name: "sendai_station",
      displayName: "仙台駅周辺",
      lat: 38.2601,
      lng: 140.8822,
      radiusKm: 3.0,
    },
    {
      name: "aoba",
      displayName: "青葉区",
      lat: 38.2687,
      lng: 140.8721,
      radiusKm: 8.0,
    },
  ];

  for (const area of areas) {
    const existing = await prisma.supportedArea.findFirst({
      where: { name: area.name },
    });
    if (!existing) {
      await prisma.supportedArea.create({ data: area });
    }
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

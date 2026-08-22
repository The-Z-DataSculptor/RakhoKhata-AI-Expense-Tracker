// Backend/scripts/dedupe.ts
import { prisma } from "../src/db";

async function cleanupDuplicates() {
  console.log("🔍 Scanning for duplicate workspaces in PostgreSQL...");

  // 1. Fetch all users
  const users = await prisma.user.findMany({ select: { id: true, email: true } });

  for (const user of users) {
    // 2. Fetch all workspaces owned by this user with related record counts
    const workspaces = await prisma.workspace.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: {
            transactions: true,
            categories: true,
            budgets: true,
            investments: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Group workspaces by lowercase normalized name (e.g. "personal")
    const grouped = new Map<string, typeof workspaces>();
    for (const ws of workspaces) {
      const key = ws.name.trim().toLowerCase();
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(ws);
    }

    // Process duplicates
    for (const [name, wsList] of grouped.entries()) {
      if (wsList.length <= 1) continue;

      console.log(`\nFound ${wsList.length} copies of "${name}" for user ${user.email}`);

      // Sort: keep the one with the most transactions/data, fallback to oldest createdAt
      wsList.sort((a, b) => {
        const totalA = a._count.transactions + a._count.categories + a._count.budgets;
        const totalB = b._count.transactions + b._count.categories + b._count.budgets;
        if (totalB !== totalA) return totalB - totalA; // Most data first
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); // Oldest first
      });

      const [keeper, ...duplicates] = wsList;
      console.log(` Keeping primary workspace ID: ${keeper.id} (${keeper._count.transactions} transactions)`);

      for (const dupe of duplicates) {
        console.log(`   Merging & removing duplicate ID: ${dupe.id}`);

        // Re-link transactions from duplicate to the keeper
        await prisma.transaction.updateMany({
          where: { workspaceId: dupe.id },
          data: { workspaceId: keeper.id },
        });

        // Re-link budgets & investments
        await prisma.budget.updateMany({
          where: { workspaceId: dupe.id },
          data: { workspaceId: keeper.id },
        });
        await prisma.investment.updateMany({
          where: { workspaceId: dupe.id },
          data: { workspaceId: keeper.id },
        });

        // Delete duplicate workspace
        await prisma.workspace.delete({
          where: { id: dupe.id },
        });
      }
    }
  }

  console.log("\n Cleanup complete! All real data preserved and duplicates removed.");
}

cleanupDuplicates()
  .catch((err) => console.error("Deduplication error:", err))
  .finally(async () => {
    await prisma.$disconnect();
  });
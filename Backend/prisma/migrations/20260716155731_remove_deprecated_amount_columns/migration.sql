/*
  Warnings:

  - You are about to drop the column `limitAmount` on the `budgets` table. All the data in the column will be lost.
  - You are about to drop the column `capitalCurrency` on the `investments` table. All the data in the column will be lost.
  - You are about to drop the column `totalInvested` on the `investments` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `transactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "budgets" DROP COLUMN "limitAmount";

-- AlterTable
ALTER TABLE "investments" DROP COLUMN "capitalCurrency",
DROP COLUMN "totalInvested";

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "amount";

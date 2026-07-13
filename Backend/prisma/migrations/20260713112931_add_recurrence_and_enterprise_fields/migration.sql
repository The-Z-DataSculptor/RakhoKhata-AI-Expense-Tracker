/*
  Warnings:

  - Added the required column `baseAmountUSD` to the `budgets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalAmount` to the `budgets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `baseAmountUSD` to the `investments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalAmount` to the `investments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `baseAmountUSD` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalAmount` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "budgets" ADD COLUMN     "baseAmountUSD" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "originalAmount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "originalCurrency" TEXT NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "dueDay" INTEGER,
ADD COLUMN     "frequency" TEXT,
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reminderDays" INTEGER;

-- AlterTable
ALTER TABLE "investments" ADD COLUMN     "baseAmountUSD" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "originalAmount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "originalCurrency" TEXT NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "baseAmountUSD" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "originalAmount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "originalCurrency" TEXT NOT NULL DEFAULT 'USD';

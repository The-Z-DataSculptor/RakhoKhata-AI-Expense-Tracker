-- AlterTable
ALTER TABLE "users" ADD COLUMN     "aiPersona" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "currency" TEXT,
ADD COLUMN     "financialGoal" TEXT,
ADD COLUMN     "languages" TEXT[],
ADD COLUMN     "occupation" TEXT;

-- Align Site table with Prisma schema
ALTER TABLE `Site`
  ADD COLUMN `ownerUserId` VARCHAR(191) NULL;


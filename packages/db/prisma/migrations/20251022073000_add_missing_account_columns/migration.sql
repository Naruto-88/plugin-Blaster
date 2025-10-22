-- Align Account table with Prisma schema
ALTER TABLE `Account`
  ADD COLUMN `paypalSubscriptionId` VARCHAR(191) NULL,
  ADD COLUMN `canMembersInvite` BOOLEAN NOT NULL DEFAULT false;


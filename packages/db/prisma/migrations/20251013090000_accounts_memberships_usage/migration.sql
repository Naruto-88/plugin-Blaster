-- Create Account table
CREATE TABLE IF NOT EXISTS `Account` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `plan` ENUM('trial','free','starter','pro','enterprise') NOT NULL DEFAULT 'free',
  `maxSites` INT NOT NULL DEFAULT 10,
  `checksPerDay` INT NOT NULL DEFAULT 200,
  `retentionDays` INT NOT NULL DEFAULT 90,
  `seatsMax` INT NOT NULL DEFAULT 5,
  `trialEndsAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create Membership table
CREATE TABLE IF NOT EXISTS `Membership` (
  `id` VARCHAR(191) NOT NULL,
  `accountId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `role` ENUM('owner','admin','member') NOT NULL DEFAULT 'member',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `Membership_accountId_userId_key`(`accountId`, `userId`),
  INDEX `Membership_userId_idx`(`userId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create AccountUsage table
CREATE TABLE IF NOT EXISTS `AccountUsage` (
  `id` VARCHAR(191) NOT NULL,
  `accountId` VARCHAR(191) NOT NULL,
  `day` DATETIME(3) NOT NULL,
  `checks` INT NOT NULL DEFAULT 0,
  UNIQUE INDEX `AccountUsage_accountId_day_key`(`accountId`, `day`),
  INDEX `AccountUsage_accountId_day_idx`(`accountId`, `day`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Backfill: add nullable accountId to Site, fill, then make NOT NULL
SET @acc := REPLACE(UUID(), '-', '');

-- Create a default account for backfill
INSERT INTO `Account` (`id`, `name`, `plan`) VALUES (@acc, 'Default Account', 'free')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Add column if missing
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Site' AND COLUMN_NAME = 'accountId');
SET @s := IF(@col_exists = 0, 'ALTER TABLE `Site` ADD COLUMN `accountId` VARCHAR(191) NULL;', 'SELECT 1;');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Fill all NULL accountId with default account
UPDATE `Site` SET `accountId` = @acc WHERE `accountId` IS NULL;

-- Enforce NOT NULL
ALTER TABLE `Site` MODIFY COLUMN `accountId` VARCHAR(191) NOT NULL;

-- Index + FK for Site.accountId
CREATE INDEX `Site_accountId_idx` ON `Site`(`accountId`);
ALTER TABLE `Site` ADD CONSTRAINT `Site_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- FK constraints for Membership and AccountUsage
ALTER TABLE `Membership` ADD CONSTRAINT `Membership_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Membership` ADD CONSTRAINT `Membership_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `AccountUsage` ADD CONSTRAINT `AccountUsage_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Optionally set an owner membership for an existing admin user
INSERT INTO `Membership` (`id`, `accountId`, `userId`, `role`)
SELECT REPLACE(UUID(), '-', ''), @acc, u.`id`, 'owner'
FROM `User` u WHERE u.`role` = 'admin'
AND NOT EXISTS (
  SELECT 1 FROM `Membership` m WHERE m.`accountId` = @acc AND m.`userId` = u.`id`
)
LIMIT 1;


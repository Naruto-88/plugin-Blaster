-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('admin', 'viewer') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Site` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `authType` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NULL,
    `appPasswordEnc` VARCHAR(191) NULL,
    `bearerTokenEnc` VARCHAR(191) NULL,
    `webhookSecretEnc` VARCHAR(191) NULL,
    `tags` JSON NOT NULL,
    `lastCheckedAt` DATETIME(3) NULL,
    `status` ENUM('ok', 'unreachable', 'auth_failed', 'unknown') NOT NULL DEFAULT 'unknown',
    `hasAnyUpdate` BOOLEAN NOT NULL DEFAULT false,
    `hasSecurityUpdate` BOOLEAN NOT NULL DEFAULT false,
    `hasChangelog` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Site_url_key`(`url`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Check` (
    `id` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(191) NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finishedAt` DATETIME(3) NULL,
    `ok` BOOLEAN NOT NULL,
    `errorText` VARCHAR(191) NULL,

    INDEX `Check_siteId_startedAt_idx`(`siteId`, `startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CoreStatus` (
    `id` VARCHAR(191) NOT NULL,
    `checkId` VARCHAR(191) NOT NULL,
    `currentVersion` VARCHAR(191) NOT NULL,
    `latestVersion` VARCHAR(191) NOT NULL,
    `updateAvailable` BOOLEAN NOT NULL,
    `security` BOOLEAN NOT NULL,

    UNIQUE INDEX `CoreStatus_checkId_key`(`checkId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PluginStatus` (
    `id` VARCHAR(191) NOT NULL,
    `checkId` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `currentVersion` VARCHAR(191) NOT NULL,
    `latestVersion` VARCHAR(191) NOT NULL,
    `updateAvailable` BOOLEAN NOT NULL,
    `security` BOOLEAN NOT NULL,
    `hasChangelog` BOOLEAN NOT NULL,
    `changelogUrl` VARCHAR(191) NULL,

    INDEX `PluginStatus_checkId_idx`(`checkId`),
    INDEX `PluginStatus_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LogEntry` (
    `id` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `level` ENUM('info', 'warn', 'error') NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,

    INDEX `LogEntry_siteId_createdAt_idx`(`siteId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Setting` (
    `key` VARCHAR(191) NOT NULL,
    `value` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Check` ADD CONSTRAINT `Check_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CoreStatus` ADD CONSTRAINT `CoreStatus_checkId_fkey` FOREIGN KEY (`checkId`) REFERENCES `Check`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PluginStatus` ADD CONSTRAINT `PluginStatus_checkId_fkey` FOREIGN KEY (`checkId`) REFERENCES `Check`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LogEntry` ADD CONSTRAINT `LogEntry_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

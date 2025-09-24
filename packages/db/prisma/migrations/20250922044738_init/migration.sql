-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'viewer');

-- CreateEnum
CREATE TYPE "SiteStatus" AS ENUM ('ok', 'unreachable', 'auth_failed', 'unknown');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('info', 'warn', 'error');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "authType" TEXT NOT NULL,
    "username" TEXT,
    "appPasswordEnc" TEXT,
    "bearerTokenEnc" TEXT,
    "webhookSecretEnc" TEXT,
    "tags" TEXT[],
    "lastCheckedAt" TIMESTAMP(3),
    "status" "SiteStatus" NOT NULL DEFAULT 'unknown',
    "hasAnyUpdate" BOOLEAN NOT NULL DEFAULT false,
    "hasSecurityUpdate" BOOLEAN NOT NULL DEFAULT false,
    "hasChangelog" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Check" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "ok" BOOLEAN NOT NULL,
    "errorText" TEXT,

    CONSTRAINT "Check_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoreStatus" (
    "id" TEXT NOT NULL,
    "checkId" TEXT NOT NULL,
    "currentVersion" TEXT NOT NULL,
    "latestVersion" TEXT NOT NULL,
    "updateAvailable" BOOLEAN NOT NULL,
    "security" BOOLEAN NOT NULL,

    CONSTRAINT "CoreStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PluginStatus" (
    "id" TEXT NOT NULL,
    "checkId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currentVersion" TEXT NOT NULL,
    "latestVersion" TEXT NOT NULL,
    "updateAvailable" BOOLEAN NOT NULL,
    "security" BOOLEAN NOT NULL,
    "hasChangelog" BOOLEAN NOT NULL,
    "changelogUrl" TEXT,

    CONSTRAINT "PluginStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogEntry" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" "LogLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "LogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Site_url_key" ON "Site"("url");

-- CreateIndex
CREATE INDEX "Check_siteId_startedAt_idx" ON "Check"("siteId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CoreStatus_checkId_key" ON "CoreStatus"("checkId");

-- CreateIndex
CREATE INDEX "PluginStatus_checkId_idx" ON "PluginStatus"("checkId");

-- CreateIndex
CREATE INDEX "PluginStatus_slug_idx" ON "PluginStatus"("slug");

-- CreateIndex
CREATE INDEX "LogEntry_siteId_createdAt_idx" ON "LogEntry"("siteId", "createdAt");

-- AddForeignKey
ALTER TABLE "Check" ADD CONSTRAINT "Check_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoreStatus" ADD CONSTRAINT "CoreStatus_checkId_fkey" FOREIGN KEY ("checkId") REFERENCES "Check"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PluginStatus" ADD CONSTRAINT "PluginStatus_checkId_fkey" FOREIGN KEY ("checkId") REFERENCES "Check"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

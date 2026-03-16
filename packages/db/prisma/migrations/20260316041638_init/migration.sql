-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'viewer');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('owner', 'admin', 'member');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('trial', 'free', 'starter', 'pro', 'enterprise');

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
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'free',
    "maxSites" INTEGER NOT NULL DEFAULT 10,
    "checksPerDay" INTEGER NOT NULL DEFAULT 200,
    "retentionDays" INTEGER NOT NULL DEFAULT 90,
    "seatsMax" INTEGER NOT NULL DEFAULT 5,
    "trialEndsAt" TIMESTAMP(3),
    "paypalSubscriptionId" TEXT,
    "canMembersInvite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "authType" TEXT NOT NULL,
    "username" TEXT,
    "appPasswordEnc" TEXT,
    "bearerTokenEnc" TEXT,
    "webhookSecretEnc" TEXT,
    "tags" JSONB NOT NULL,
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

-- CreateTable
CREATE TABLE "AccountUsage" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "checks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AccountUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_accountId_userId_key" ON "Membership"("accountId", "userId");

-- CreateIndex
CREATE INDEX "Site_accountId_idx" ON "Site"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Site_accountId_url_key" ON "Site"("accountId", "url");

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

-- CreateIndex
CREATE INDEX "AccountUsage_accountId_day_idx" ON "AccountUsage"("accountId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "AccountUsage_accountId_day_key" ON "AccountUsage"("accountId", "day");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Check" ADD CONSTRAINT "Check_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoreStatus" ADD CONSTRAINT "CoreStatus_checkId_fkey" FOREIGN KEY ("checkId") REFERENCES "Check"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PluginStatus" ADD CONSTRAINT "PluginStatus_checkId_fkey" FOREIGN KEY ("checkId") REFERENCES "Check"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountUsage" ADD CONSTRAINT "AccountUsage_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `achievedCountTotal` on the `BillingRecord` table. All the data in the column will be lost.
  - You are about to drop the column `billingPeriodEndDate` on the `BillingRecord` table. All the data in the column will be lost.
  - You are about to drop the column `billingPeriodStartDate` on the `BillingRecord` table. All the data in the column will be lost.
  - You are about to drop the column `calculatedAmount` on the `BillingRecord` table. All the data in the column will be lost.
  - You are about to drop the column `clientName` on the `BillingRecord` table. All the data in the column will be lost.
  - You are about to drop the column `countMetricLabelUsed` on the `BillingRecord` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `BillingRecord` table. All the data in the column will be lost.
  - You are about to drop the column `formulaUsed` on the `BillingRecord` table. All the data in the column will be lost.
  - You are about to drop the column `hoursBilled` on the `BillingRecord` table. All the data in the column will be lost.
  - You are about to drop the column `isCountBased` on the `BillingRecord` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `BillingRecord` table. All the data in the column will be lost.
  - You are about to drop the column `rateApplied` on the `BillingRecord` table. All the data in the column will be lost.
  - You are about to drop the column `billingType` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `countDivisor` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `countMetricLabel` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `countMultiplier` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `ratePerHour` on the `Project` table. All the data in the column will be lost.
  - Added the required column `billingAmount` to the `BillingRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rate` to the `BillingRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reportId` to the `BillingRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalCount` to the `BillingRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalItems` to the `BillingRecord` table without a default value. This is not possible if the table is not empty.
  - Made the column `projectName` on table `BillingRecord` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `billingConfig` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fieldConfig` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reportData" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Report_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReportItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "itemData" TEXT NOT NULL,
    CONSTRAINT "ReportItem_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ObjectIDIndex" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "objectId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ObjectIDIndex_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ObjectIDIndex_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ObjectIDIndex_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BillingRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "totalItems" INTEGER NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "rate" DECIMAL NOT NULL,
    "billingAmount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BillingRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BillingRecord_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BillingRecord_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BillingRecord" ("createdAt", "id", "projectId", "projectName", "status", "updatedAt", "userId") SELECT "createdAt", "id", "projectId", "projectName", "status", "updatedAt", "userId" FROM "BillingRecord";
DROP TABLE "BillingRecord";
ALTER TABLE "new_BillingRecord" RENAME TO "BillingRecord";
CREATE UNIQUE INDEX "BillingRecord_reportId_key" ON "BillingRecord"("reportId");
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "fieldConfig" TEXT NOT NULL,
    "billingConfig" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Project" ("createdAt", "id", "name", "updatedAt") SELECT "createdAt", "id", "name", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_name_key" ON "Project"("name");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "profilePictureUrl" TEXT,
    "phone" TEXT,
    "department" TEXT,
    "joinDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "department", "email", "firstName", "id", "joinDate", "lastName", "passwordHash", "phone", "profilePictureUrl", "role", "updatedAt", "username") SELECT "createdAt", "department", "email", "firstName", "id", "joinDate", "lastName", "passwordHash", "phone", "profilePictureUrl", "role", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "ObjectIDIndex_objectId_projectId_key" ON "ObjectIDIndex"("objectId", "projectId");

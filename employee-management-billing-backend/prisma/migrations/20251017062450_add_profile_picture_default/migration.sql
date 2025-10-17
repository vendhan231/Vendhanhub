-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "profilePictureUrl" TEXT NOT NULL DEFAULT '/default-avatar.png',
    "phone" TEXT,
    "department" TEXT,
    "joinDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "department", "email", "firstName", "id", "joinDate", "lastName", "passwordHash", "phone", "profilePictureUrl", "role", "updatedAt", "username") SELECT "createdAt", "department", "email", "firstName", "id", "joinDate", "lastName", "passwordHash", "phone", coalesce("profilePictureUrl", '/default-avatar.png') AS "profilePictureUrl", "role", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

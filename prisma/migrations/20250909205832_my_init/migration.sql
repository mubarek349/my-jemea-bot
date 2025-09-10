/*
  Warnings:

  - You are about to drop the column `groupId` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `isScheduled` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `sentAt` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the `bot_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `group_users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `groups` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `group_users` DROP FOREIGN KEY `group_users_groupId_fkey`;

-- DropForeignKey
ALTER TABLE `group_users` DROP FOREIGN KEY `group_users_userId_fkey`;

-- DropForeignKey
ALTER TABLE `messages` DROP FOREIGN KEY `messages_groupId_fkey`;

-- DropIndex
DROP INDEX `messages_groupId_fkey` ON `messages`;

-- AlterTable
ALTER TABLE `messages` DROP COLUMN `groupId`,
    DROP COLUMN `isScheduled`,
    DROP COLUMN `sentAt`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `title` TEXT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `content` TEXT NOT NULL;

-- DropTable
DROP TABLE `bot_settings`;

-- DropTable
DROP TABLE `group_users`;

-- DropTable
DROP TABLE `groups`;

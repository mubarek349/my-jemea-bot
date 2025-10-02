/*
  Warnings:

  - A unique constraint covering the columns `[phoneno]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Made the column `firstName` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `users` MODIFY `chatId` VARCHAR(191) NULL,
    MODIFY `firstName` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_phoneno_key` ON `users`(`phoneno`);

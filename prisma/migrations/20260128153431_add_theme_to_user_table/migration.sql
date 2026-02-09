/*
  Warnings:

  - You are about to drop the column `status` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Item` DROP COLUMN `status`;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `status`,
    ADD COLUMN `theme` ENUM('DARK', 'LIGHT', 'SISTEM') NOT NULL DEFAULT 'SISTEM';

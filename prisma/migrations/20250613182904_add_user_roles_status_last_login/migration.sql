/*
  Warnings:

  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `User` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `lastLogin` DATETIME(3) NULL,
    ADD COLUMN `name` VARCHAR(191) NULL,
    ADD COLUMN `role` ENUM('ADMIN', 'MANAGER', 'STAFF', 'VIEWER') NOT NULL DEFAULT 'STAFF',
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

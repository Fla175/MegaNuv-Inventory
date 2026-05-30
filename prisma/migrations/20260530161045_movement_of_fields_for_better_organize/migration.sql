/*
  Warnings:

  - Made the column `categoryId` on table `Active` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Active` DROP FOREIGN KEY `Active_categoryId_fkey`;

-- AlterTable
ALTER TABLE `Active` MODIFY `categoryId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Active` ADD CONSTRAINT `Active_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

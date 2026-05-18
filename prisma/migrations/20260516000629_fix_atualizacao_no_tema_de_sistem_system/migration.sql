/*
  Warnings:

  - You are about to drop the column `defaultSort` on the `User` table. All the data in the column will be lost.
  - You are about to alter the column `theme` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(1))` to `Enum(EnumId(1))`.
  - You are about to drop the `Area` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `fatherSpaceId` on table `Active` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Active` DROP FOREIGN KEY `Active_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `Active` DROP FOREIGN KEY `Active_fatherSpaceId_fkey`;

-- AlterTable
ALTER TABLE `Active` MODIFY `fatherSpaceId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `FatherSpace` ADD COLUMN `address` VARCHAR(191) NULL,
    ADD COLUMN `imageUrl` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `responsible` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `defaultSort`,
    ADD COLUMN `isSystem` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `role` ENUM('DIRECTOR', 'ADMIN', 'MANAGER', 'VIEWER') NOT NULL DEFAULT 'VIEWER',
    MODIFY `theme` ENUM('DARK', 'LIGHT', 'SYSTEM') NOT NULL DEFAULT 'SYSTEM';

-- DropTable
DROP TABLE `Area`;

-- CreateTable
CREATE TABLE `Category` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Category_name_key`(`name`),
    UNIQUE INDEX `Category_color_key`(`color`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Active` ADD CONSTRAINT `Active_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Active` ADD CONSTRAINT `Active_fatherSpaceId_fkey` FOREIGN KEY (`fatherSpaceId`) REFERENCES `FatherSpace`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

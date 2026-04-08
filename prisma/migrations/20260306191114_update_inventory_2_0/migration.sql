/*
  Warnings:

  - You are about to drop the `Item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ItemDefinition` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ItemInstance` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Item` DROP FOREIGN KEY `Item_definitionId_fkey`;

-- DropForeignKey
ALTER TABLE `Item` DROP FOREIGN KEY `Item_locationId_fkey`;

-- DropForeignKey
ALTER TABLE `ItemInstance` DROP FOREIGN KEY `ItemInstance_parentId_fkey`;

-- DropTable
DROP TABLE `Item`;

-- DropTable
DROP TABLE `ItemDefinition`;

-- DropTable
DROP TABLE `ItemInstance`;

-- CreateTable
CREATE TABLE `FatherSpace` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `createdById` VARCHAR(191) NULL,
    `parentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FatherSpace_name_key`(`name`),
    INDEX `FatherSpace_parentId_idx`(`parentId`),
    INDEX `FatherSpace_createdById_idx`(`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Active` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` ENUM('ENERGETICA', 'REDES', 'SERVIDOR', 'MANUTENCAO') NOT NULL,
    `sku` VARCHAR(191) NULL,
    `manufacturer` VARCHAR(191) NULL,
    `model` VARCHAR(191) NULL,
    `serialNumber` VARCHAR(191) NULL,
    `fixedValue` DOUBLE NOT NULL DEFAULT 0,
    `parentId` VARCHAR(191) NULL,
    `isPhysicalSpace` BOOLEAN NOT NULL,
    `tag` VARCHAR(191) NOT NULL DEFAULT 'IN-STOCK',
    `notes` TEXT NULL,
    `fatherSpaceId` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `fileUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Active_fatherSpaceId_idx`(`fatherSpaceId`),
    INDEX `Active_parentId_idx`(`parentId`),
    INDEX `Active_createdById_idx`(`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FatherSpace` ADD CONSTRAINT `FatherSpace_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FatherSpace` ADD CONSTRAINT `FatherSpace_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `FatherSpace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Active` ADD CONSTRAINT `Active_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Active`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Active` ADD CONSTRAINT `Active_fatherSpaceId_fkey` FOREIGN KEY (`fatherSpaceId`) REFERENCES `FatherSpace`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Active` ADD CONSTRAINT `Active_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

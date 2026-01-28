-- AlterTable
ALTER TABLE `Item` ADD COLUMN `imageUrl` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ItemDefinition` ADD COLUMN `imageUrl` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ItemInstance` ADD COLUMN `imageUrl` VARCHAR(191) NULL;

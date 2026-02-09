-- AlterTable
ALTER TABLE `Item` ADD COLUMN `specifications` JSON NULL;

-- AlterTable
ALTER TABLE `ItemDefinition` ADD COLUMN `brand` VARCHAR(191) NULL,
    ADD COLUMN `line` VARCHAR(191) NULL,
    ADD COLUMN `specifications` JSON NULL;

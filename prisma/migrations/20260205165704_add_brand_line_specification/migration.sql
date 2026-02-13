-- AlterTable
ALTER TABLE `Item` ADD COLUMN `specifications` JSON NULL;

-- AlterTable
ALTER TABLE `ItemDefinition` ADD COLUMN `manufacturer` VARCHAR(191) NULL,
    ADD COLUMN `model` VARCHAR(191) NULL,
    ADD COLUMN `specifications` JSON NULL;

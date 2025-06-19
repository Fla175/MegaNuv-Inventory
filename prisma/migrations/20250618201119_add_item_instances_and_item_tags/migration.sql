-- AlterTable
ALTER TABLE `Item` ADD COLUMN `ean` VARCHAR(191) NULL,
    ADD COLUMN `idLegado` INTEGER NULL,
    ADD COLUMN `idParent` VARCHAR(191) NULL,
    ADD COLUMN `isEcommerceIntegrated` BOOLEAN NULL,
    ADD COLUMN `isMoved` BOOLEAN NULL,
    ADD COLUMN `maxStockQuantity` INTEGER NULL,
    ADD COLUMN `minStockQuantity` INTEGER NULL,
    ADD COLUMN `stockLevel` VARCHAR(191) NULL,
    ADD COLUMN `tags` JSON NULL,
    ADD COLUMN `variacao` INTEGER NULL;

-- CreateTable
CREATE TABLE `ItemInstance` (
    `id` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `serialNumber` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NULL,
    `qrCodePath` VARCHAR(191) NULL,
    `isInUse` BOOLEAN NOT NULL DEFAULT false,
    `purchaseDate` DATETIME(3) NULL,
    `warrantyEndDate` DATETIME(3) NULL,
    `lastMaintenanceDate` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ItemInstance_serialNumber_key`(`serialNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ItemInstance` ADD CONSTRAINT `ItemInstance_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

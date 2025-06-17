-- CreateTable
CREATE TABLE `Item` (
    `id` VARCHAR(191) NOT NULL,
    `contaAzulId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `stockQuantity` INTEGER NOT NULL DEFAULT 0,
    `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `cost` DECIMAL(10, 2) NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'PRODUCT',
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `lastContaAzulSync` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Item_contaAzulId_key`(`contaAzulId`),
    UNIQUE INDEX `Item_sku_key`(`sku`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

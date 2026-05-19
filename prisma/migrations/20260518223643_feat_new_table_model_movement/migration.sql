-- CreateTable
CREATE TABLE `Movement` (
    `id` VARCHAR(191) NOT NULL,
    `activeId` VARCHAR(191) NOT NULL,
    `fromSpaceId` VARCHAR(191) NOT NULL,
    `toSpaceId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Movement` ADD CONSTRAINT `Movement_activeId_fkey` FOREIGN KEY (`activeId`) REFERENCES `Active`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

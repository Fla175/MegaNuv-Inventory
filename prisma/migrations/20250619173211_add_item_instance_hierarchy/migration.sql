-- AlterTable
ALTER TABLE `ItemInstance` ADD COLUMN `parentId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `ItemInstance` ADD CONSTRAINT `ItemInstance_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `ItemInstance`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

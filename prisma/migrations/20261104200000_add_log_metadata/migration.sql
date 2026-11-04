-- AlterTable
ALTER TABLE `Log` ADD COLUMN `success` TINYINT(1),
ADD COLUMN `targetUserId` VARCHAR(191);

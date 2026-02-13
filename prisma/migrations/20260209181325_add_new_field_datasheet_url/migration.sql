/*
  Warnings:

  - You are about to drop the column `specifications` on the `ItemDefinition` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `ItemDefinition` DROP COLUMN `specifications`,
    ADD COLUMN `datasheetUrl` VARCHAR(191) NULL;

/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `ItemInstance` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `ItemInstance_name_key` ON `ItemInstance`(`name`);

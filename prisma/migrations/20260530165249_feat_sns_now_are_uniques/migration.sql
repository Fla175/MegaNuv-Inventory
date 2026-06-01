/*
  Warnings:

  - A unique constraint covering the columns `[serialNumber]` on the table `Active` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Active_serialNumber_key` ON `Active`(`serialNumber`);

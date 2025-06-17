-- AlterTable
ALTER TABLE `ContaAzulIntegration` MODIFY `accessToken` TEXT NOT NULL,
    MODIFY `refreshToken` TEXT NOT NULL,
    MODIFY `scope` VARCHAR(500) NULL;

-- Add fileAlias column to Active table (ADR-012)
-- Parallel array to fileUrl for friendly document aliases
ALTER TABLE `Active` ADD COLUMN `fileAlias` TEXT NULL;

ALTER TABLE `studio_locations`
  ADD COLUMN `assetKind` VARCHAR(191) NOT NULL DEFAULT 'location';

ALTER TABLE `global_locations`
  ADD COLUMN `assetKind` VARCHAR(191) NOT NULL DEFAULT 'location';

ALTER TABLE `studio_clips`
  ADD COLUMN `props` TEXT NULL;

ALTER TABLE `studio_panels`
  ADD COLUMN `props` TEXT NULL;

-- DO NOT APPLY YET / NO db push / NO migrate deploy
-- W11B-FIX-01: shortened 2 UNIQUE index names to MySQL 64-char limit (dry-run 2026-09-12)
-- V11 Wave2 additive core — CREATE-only draft derived from prisma/v11-wave2.prisma.fragment
-- Date: 2026-09-12 (Asia/Shanghai). Human approval required before apply.
-- Source: prisma/v11-wave2.prisma.fragment (V11* models). No DROP / no data backfill.

-- CreateTable
CREATE TABLE `v11_project_manifests` (
    `id` VARCHAR(192) NOT NULL,
    `projectId` VARCHAR(192) NOT NULL,
    `schemaVersion` VARCHAR(64) NOT NULL,
    `profile` VARCHAR(16) NOT NULL,
    `aspectRatio` VARCHAR(32) NOT NULL,
    `lockPolicyVersion` VARCHAR(64) NOT NULL,
    `budgetEnvelopeRef` VARCHAR(192) NULL,
    `contentSha256` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL,

    INDEX `v11_project_manifests_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `v11_story_bible_revisions` (
    `id` VARCHAR(192) NOT NULL,
    `projectId` VARCHAR(192) NOT NULL,
    `revisionNo` INTEGER NOT NULL,
    `predecessorRevisionId` VARCHAR(192) NULL,
    `contentSha256` VARCHAR(64) NOT NULL,
    `factIdsJson` LONGTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `v11_story_bible_revisions_projectId_revisionNo_key`(`projectId`, `revisionNo`),
    INDEX `v11_story_bible_revisions_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `v11_canon_facts` (
    `id` VARCHAR(192) NOT NULL,
    `projectId` VARCHAR(192) NOT NULL,
    `key` VARCHAR(192) NOT NULL,
    `valueJson` LONGTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL,

    INDEX `v11_canon_facts_projectId_key_idx`(`projectId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `v11_visual_bible_revisions` (
    `id` VARCHAR(192) NOT NULL,
    `projectId` VARCHAR(192) NOT NULL,
    `revisionNo` INTEGER NOT NULL,
    `styleKey` VARCHAR(192) NOT NULL,
    `lensSetJson` LONGTEXT NOT NULL,
    `colorGradeKey` VARCHAR(192) NOT NULL,
    `lightingLogicKey` VARCHAR(192) NOT NULL,
    `frameRate` DOUBLE NOT NULL,
    `motionBanKeysJson` LONGTEXT NOT NULL,
    `contentSha256` VARCHAR(64) NOT NULL,
    `lockedBy` VARCHAR(192) NULL,
    `lockedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `v11_visual_bible_revisions_projectId_revisionNo_key`(`projectId`, `revisionNo`),
    INDEX `v11_visual_bible_revisions_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `v11_character_dna_revisions` (
    `id` VARCHAR(192) NOT NULL,
    `projectId` VARCHAR(192) NOT NULL,
    `characterId` VARCHAR(192) NOT NULL,
    `revisionNo` INTEGER NOT NULL,
    `predecessorRevisionId` VARCHAR(192) NULL,
    `appearanceRevisionId` VARCHAR(192) NOT NULL,
    `appearanceContentSha256` VARCHAR(64) NOT NULL,
    `wardrobeKeysJson` LONGTEXT NOT NULL,
    `propKeysJson` LONGTEXT NOT NULL,
    `propBibleRevisionIdsJson` LONGTEXT NOT NULL,
    `voiceRevisionId` VARCHAR(192) NOT NULL,
    `voiceKey` VARCHAR(192) NOT NULL,
    `voiceContentSha256` VARCHAR(64) NOT NULL,
    `visualBibleRevisionId` VARCHAR(192) NULL,
    `visualBibleContentSha256` VARCHAR(64) NULL,
    `identityPolicyId` VARCHAR(192) NOT NULL,
    `identityPolicyVersion` VARCHAR(64) NOT NULL,
    `minIdentityScore` DOUBLE NOT NULL,
    `poseTolerance` DOUBLE NOT NULL,
    `referenceBindingsJson` LONGTEXT NOT NULL,
    `lockedBy` VARCHAR(192) NULL,
    `lockedAt` DATETIME(3) NULL,
    `contentSha256` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `v11_character_dna_revisions_projectId_characterId_revisionNo_key`(`projectId`, `characterId`, `revisionNo`),
    INDEX `v11_character_dna_revisions_appearanceRevisionId_idx`(`appearanceRevisionId`),
    INDEX `v11_character_dna_revisions_projectId_characterId_idx`(`projectId`, `characterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `v11_scene_bible_revisions` (
    `id` VARCHAR(192) NOT NULL,
    `projectId` VARCHAR(192) NOT NULL,
    `locationId` VARCHAR(192) NOT NULL,
    `revisionNo` INTEGER NOT NULL,
    `predecessorRevisionId` VARCHAR(192) NULL,
    `artifactRevisionId` VARCHAR(192) NULL,
    `contentSha256` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `v11_scene_bible_revisions_projectId_locationId_revisionNo_key`(`projectId`, `locationId`, `revisionNo`),
    INDEX `v11_scene_bible_revisions_projectId_locationId_idx`(`projectId`, `locationId`),
    INDEX `v11_scene_bible_revisions_artifactRevisionId_idx`(`artifactRevisionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `v11_prop_bible_revisions` (
    `id` VARCHAR(192) NOT NULL,
    `projectId` VARCHAR(192) NOT NULL,
    `propId` VARCHAR(192) NOT NULL,
    `revisionNo` INTEGER NOT NULL,
    `predecessorRevisionId` VARCHAR(192) NULL,
    `stateKey` VARCHAR(192) NOT NULL,
    `artifactRevisionId` VARCHAR(192) NULL,
    `contentSha256` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `v11_prop_bible_revisions_projectId_propId_revisionNo_key`(`projectId`, `propId`, `revisionNo`),
    INDEX `v11_prop_bible_revisions_projectId_propId_idx`(`projectId`, `propId`),
    INDEX `v11_prop_bible_revisions_artifactRevisionId_idx`(`artifactRevisionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `v11_episode_manifest_revisions` (
    `id` VARCHAR(192) NOT NULL,
    `projectId` VARCHAR(192) NOT NULL,
    `episodeKey` VARCHAR(192) NOT NULL,
    `revisionNo` INTEGER NOT NULL,
    `shotSpecIdsJson` LONGTEXT NOT NULL,
    `durationBudgetSec` DOUBLE NULL,
    `lockedStoryBibleRevisionId` VARCHAR(192) NOT NULL,
    `lockedVisualBibleRevisionId` VARCHAR(192) NOT NULL,
    `lockedCharacterDnaRevisionIdsJson` LONGTEXT NOT NULL,
    `contentSha256` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `v11_emr_proj_ep_rev_key`(`projectId`, `episodeKey`, `revisionNo`),
    INDEX `v11_episode_manifest_revisions_projectId_episodeKey_idx`(`projectId`, `episodeKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `v11_shot_spec_revisions` (
    `id` VARCHAR(192) NOT NULL,
    `projectId` VARCHAR(192) NOT NULL,
    `episodeManifestId` VARCHAR(192) NOT NULL,
    `shotKey` VARCHAR(192) NOT NULL,
    `revisionNo` INTEGER NOT NULL,
    `tier` VARCHAR(8) NOT NULL,
    `durationSec` DOUBLE NOT NULL,
    `characterIdsJson` LONGTEXT NOT NULL,
    `sceneBibleRevisionId` VARCHAR(192) NOT NULL,
    `cameraJson` LONGTEXT NOT NULL,
    `blocking` LONGTEXT NOT NULL,
    `performanceNotes` LONGTEXT NULL,
    `dialogueRef` VARCHAR(192) NULL,
    `continuityConstraintsJson` LONGTEXT NOT NULL,
    `humanReviewRequired` BOOLEAN NOT NULL,
    `lockedBy` VARCHAR(192) NULL,
    `lockedAt` DATETIME(3) NULL,
    `contentSha256` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `v11_ssr_proj_epm_shot_rev_key`(`projectId`, `episodeManifestId`, `shotKey`, `revisionNo`),
    INDEX `v11_shot_spec_revisions_episodeManifestId_shotKey_idx`(`episodeManifestId`, `shotKey`),
    INDEX `v11_shot_spec_revisions_projectId_episodeManifestId_idx`(`projectId`, `episodeManifestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `v11_take_manifests` (
    `id` VARCHAR(192) NOT NULL,
    `projectId` VARCHAR(192) NOT NULL,
    `subjectKind` VARCHAR(64) NOT NULL,
    `subjectId` VARCHAR(192) NOT NULL,
    `purpose` VARCHAR(64) NOT NULL,
    `policyId` VARCHAR(192) NOT NULL,
    `policyVersion` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL,

    INDEX `v11_take_manifests_projectId_subjectKind_subjectId_idx`(`projectId`, `subjectKind`, `subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `v11_takes` (
    `id` VARCHAR(192) NOT NULL,
    `takeManifestId` VARCHAR(192) NOT NULL,
    `ordinal` INTEGER NOT NULL,
    `artifactRevisionId` VARCHAR(192) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `v11_takes_takeManifestId_ordinal_key`(`takeManifestId`, `ordinal`),
    INDEX `v11_takes_artifactRevisionId_idx`(`artifactRevisionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `v11_take_selections` (
    `id` VARCHAR(192) NOT NULL,
    `takeManifestId` VARCHAR(192) NOT NULL,
    `takeId` VARCHAR(192) NOT NULL,
    `selectedBy` VARCHAR(192) NULL,
    `createdAt` DATETIME(3) NOT NULL,

    INDEX `v11_take_selections_takeManifestId_createdAt_idx`(`takeManifestId`, `createdAt`),
    INDEX `v11_take_selections_takeId_idx`(`takeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `v11_take_selection_heads` (
    `takeManifestId` VARCHAR(192) NOT NULL,
    `version` INTEGER NOT NULL,
    `currentTakeId` VARCHAR(192) NULL,

    PRIMARY KEY (`takeManifestId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `v11_qc_reports` (
    `id` VARCHAR(192) NOT NULL,
    `projectId` VARCHAR(192) NOT NULL,
    `episodeManifestId` VARCHAR(192) NULL,
    `subjectType` VARCHAR(32) NOT NULL,
    `subjectId` VARCHAR(192) NOT NULL,
    `profile` VARCHAR(16) NOT NULL,
    `policyId` VARCHAR(192) NOT NULL,
    `policyVersion` VARCHAR(64) NOT NULL,
    `status` VARCHAR(16) NOT NULL,
    `diagnosisIdsJson` LONGTEXT NOT NULL,
    `contentSha256` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL,

    INDEX `v11_qc_reports_projectId_subjectType_subjectId_idx`(`projectId`, `subjectType`, `subjectId`),
    INDEX `v11_qc_reports_episodeManifestId_idx`(`episodeManifestId`),
    INDEX `v11_qc_reports_projectId_status_idx`(`projectId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `v11_qc_gate_scorecards` (
    `id` VARCHAR(192) NOT NULL,
    `qcReportId` VARCHAR(192) NOT NULL,
    `gateId` VARCHAR(16) NOT NULL,
    `subjectType` VARCHAR(32) NOT NULL,
    `subjectId` VARCHAR(192) NOT NULL,
    `policyId` VARCHAR(192) NOT NULL,
    `policyVersion` VARCHAR(64) NOT NULL,
    `profile` VARCHAR(16) NOT NULL,
    `status` VARCHAR(16) NOT NULL,
    `score` DOUBLE NULL,
    `hardVeto` BOOLEAN NOT NULL,
    `dimensionsJson` LONGTEXT NOT NULL,
    `findingsJson` LONGTEXT NOT NULL,
    `provenanceJson` LONGTEXT NOT NULL,
    `decidedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `v11_qc_gate_scorecards_qcReportId_gateId_key`(`qcReportId`, `gateId`),
    INDEX `v11_qc_gate_scorecards_subjectType_subjectId_idx`(`subjectType`, `subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `v11_qc_diagnoses` (
    `id` VARCHAR(192) NOT NULL,
    `qcReportId` VARCHAR(192) NOT NULL,
    `gateId` VARCHAR(16) NOT NULL,
    `subjectType` VARCHAR(32) NOT NULL,
    `subjectId` VARCHAR(192) NOT NULL,
    `status` VARCHAR(16) NOT NULL,
    `primaryFailureCodesJson` LONGTEXT NOT NULL,
    `failedLayersJson` LONGTEXT NOT NULL,
    `failedShotIdsJson` LONGTEXT NOT NULL,
    `suggestedScopeJson` LONGTEXT NOT NULL,
    `escalate` BOOLEAN NOT NULL,
    `evidenceRefsJson` LONGTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL,

    INDEX `v11_qc_diagnoses_qcReportId_idx`(`qcReportId`),
    INDEX `v11_qc_diagnoses_qcReportId_gateId_idx`(`qcReportId`, `gateId`),
    INDEX `v11_qc_diagnoses_subjectType_subjectId_idx`(`subjectType`, `subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `v11_repair_plans` (
    `id` VARCHAR(192) NOT NULL,
    `projectId` VARCHAR(192) NOT NULL,
    `episodeManifestId` VARCHAR(192) NOT NULL,
    `diagnosisId` VARCHAR(192) NOT NULL,
    `qcReportId` VARCHAR(192) NULL,
    `strategy` VARCHAR(32) NOT NULL,
    `scopesJson` LONGTEXT NOT NULL,
    `maxCycles` INTEGER NOT NULL,
    `budgetReservationId` VARCHAR(192) NULL,
    `preserveLocksJson` LONGTEXT NOT NULL,
    `output` VARCHAR(32) NOT NULL,
    `takeManifestId` VARCHAR(192) NULL,
    `createdAt` DATETIME(3) NOT NULL,

    INDEX `v11_repair_plans_projectId_episodeManifestId_idx`(`projectId`, `episodeManifestId`),
    INDEX `v11_repair_plans_diagnosisId_idx`(`diagnosisId`),
    INDEX `v11_repair_plans_qcReportId_idx`(`qcReportId`),
    INDEX `v11_repair_plans_takeManifestId_idx`(`takeManifestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `v11_human_locks` (
    `id` VARCHAR(192) NOT NULL,
    `subjectType` VARCHAR(64) NOT NULL,
    `subjectId` VARCHAR(192) NOT NULL,
    `revisionId` VARCHAR(192) NOT NULL,
    `contentSha256` VARCHAR(64) NOT NULL,
    `lockedBy` VARCHAR(192) NOT NULL,
    `lockedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `v11_human_locks_subjectType_subjectId_key`(`subjectType`, `subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `v11_scene_state_snapshots` (
    `id` VARCHAR(192) NOT NULL,
    `projectId` VARCHAR(192) NOT NULL,
    `contentSha256` VARCHAR(64) NOT NULL,
    `stateJson` LONGTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL,

    INDEX `v11_scene_state_snapshots_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `v11_shot_continuity_locks` (
    `id` VARCHAR(192) NOT NULL,
    `shotSpecId` VARCHAR(192) NOT NULL,
    `contentSha256` VARCHAR(64) NOT NULL,
    `bindingJson` LONGTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL,

    INDEX `v11_shot_continuity_locks_shotSpecId_idx`(`shotSpecId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `v11_voice_revisions` (
    `id` VARCHAR(192) NOT NULL,
    `projectId` VARCHAR(192) NOT NULL,
    `characterId` VARCHAR(192) NOT NULL,
    `voiceKey` VARCHAR(192) NOT NULL,
    `contentSha256` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL,

    INDEX `v11_voice_revisions_projectId_characterId_idx`(`projectId`, `characterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

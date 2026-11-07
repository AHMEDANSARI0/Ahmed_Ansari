-- Section anchors are part of the public URL contract: #work must reach the
-- projects section, not #projects.
UPDATE "sections" SET "anchor" = 'work' WHERE "key" = 'projects' AND "anchor" = 'projects';

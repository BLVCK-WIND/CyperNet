ALTER TABLE accounts ADD COLUMN auth_generation VARCHAR(36) NULL;
UPDATE accounts SET auth_generation = UUID() WHERE auth_generation IS NULL;
ALTER TABLE accounts MODIFY COLUMN auth_generation VARCHAR(36) NOT NULL;

ALTER TABLE refresh_tokens ADD COLUMN auth_generation VARCHAR(36) NULL;

-- Normalize existing RUTs so the unique index uses a consistent representation.
UPDATE "User"
SET "rut" = CASE
    WHEN LENGTH(regexp_replace(UPPER(TRIM("rut")), '[^0-9K]', '', 'g')) >= 2 THEN
      CONCAT(
        LEFT(
          regexp_replace(UPPER(TRIM("rut")), '[^0-9K]', '', 'g'),
          LENGTH(regexp_replace(UPPER(TRIM("rut")), '[^0-9K]', '', 'g')) - 1
        ),
        '-',
        RIGHT(regexp_replace(UPPER(TRIM("rut")), '[^0-9K]', '', 'g'), 1)
      )
    ELSE UPPER(TRIM("rut"))
  END
WHERE "rut" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_rut_key" ON "User"("rut");

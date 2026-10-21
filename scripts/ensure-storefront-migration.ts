/**
 * Remote D1 may already have storefrontLayout/storefrontSkin from a partial
 * apply of 0004, while d1_migrations does not record it. Mark 0004 applied so
 * wrangler skips the migration instead of failing with duplicate column.
 */
import { $ } from "bun";

const MIGRATION_NAME = "0004_storefront_templates.sql";

type D1ExecuteResult = Array<{
  results?: Array<Record<string, unknown>>;
  success?: boolean;
}>;

async function d1Json(command: string): Promise<D1ExecuteResult> {
  const proc = await $`wrangler d1 execute DB --remote --json --command=${command}`.quiet().nothrow();
  if (proc.exitCode !== 0) {
    const err = proc.stderr.toString() || proc.stdout.toString();
    throw new Error(`wrangler d1 execute failed: ${err}`);
  }
  return JSON.parse(proc.stdout.toString()) as D1ExecuteResult;
}

function rows(result: D1ExecuteResult): Array<Record<string, unknown>> {
  return result?.[0]?.results ?? [];
}

async function main() {
  let columnRows: Array<Record<string, unknown>>;
  try {
    columnRows = rows(await d1Json("PRAGMA table_info(siteSetting)"));
  } catch (error) {
    console.warn("[ensure-storefront-migration] skip: cannot inspect remote siteSetting", error);
    return;
  }

  const hasLayout = columnRows.some((row) => row.name === "storefrontLayout");
  const hasSkin = columnRows.some((row) => row.name === "storefrontSkin");
  if (!hasLayout || !hasSkin) {
    console.log("[ensure-storefront-migration] columns missing; letting migration 0004 run");
    return;
  }

  let migrationRows: Array<Record<string, unknown>>;
  try {
    migrationRows = rows(await d1Json("SELECT name FROM d1_migrations"));
  } catch (error) {
    console.warn("[ensure-storefront-migration] skip: cannot read d1_migrations", error);
    return;
  }

  const applied = migrationRows.some((row) => row.name === MIGRATION_NAME);
  if (applied) {
    console.log("[ensure-storefront-migration] 0004 already recorded");
    return;
  }

  console.log("[ensure-storefront-migration] columns exist; marking 0004 as applied");
  await d1Json(
    `INSERT INTO d1_migrations (name, applied_at) VALUES ('${MIGRATION_NAME}', datetime('now'))`,
  );
}

await main();

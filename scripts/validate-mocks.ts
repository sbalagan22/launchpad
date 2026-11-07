/* STUB: full referential-integrity checks land with the finished seeds. */
import { Db } from "../src/schemas";
import { buildSeed } from "../src/mocks/seed";

const r = Db.safeParse(buildSeed());
if (!r.success) {
  console.error(r.error.issues.slice(0, 10));
  process.exit(1);
}
console.log("Schema check passed (stub).");

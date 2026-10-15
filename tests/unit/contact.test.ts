import assert from "node:assert/strict";
import { test } from "node:test";
import { contactInputSchema } from "../../lib/validations/contact";
import { createTestDatabase } from "../../scripts/database";
const input = {
  name: "Fixture sender",
  email: "fixture@example.test",
  message: "A private fixture message.",
  company: "",
};
assert.equal(contactInputSchema.safeParse(input).success, true);
for (const value of [
  { ...input, email: "not-email" },
  { ...input, company: "spam" },
  { ...input, message: "short" },
  { ...input, role: "admin" },
])
  assert.equal(contactInputSchema.safeParse(value).success, false);
test("contact intake is service-only, bounded, toggle-aware and private", async () => {
  const db = await createTestDatabase();
  try {
    const call = (key = "1".repeat(64)) =>
      db.query<{ result: string }>(
        "select public.submit_contact_message($1,$2,$3,$4) as result",
        [input.name, input.email, input.message, key],
      );
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      await assert.rejects(
        call(),
        (error: unknown) =>
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "42501",
      );
      await db.exec("reset role");
    }
    await db.exec(
      `insert into public.site_settings(name,status,contact_form_enabled) values('Test','published',true);insert into public.section_settings(key,title,status,visible) values('contact','Contact','published',true);`,
    );
    await db.exec("set role service_role");
    for (let i = 0; i < 5; i++)
      assert.equal((await call()).rows[0].result, "stored");
    assert.equal((await call()).rows[0].result, "rate_limited");
    assert.equal(
      (
        await db.query<{ result: string }>(
          "select public.submit_contact_message('Name','bad','message long enough',$1) as result",
          ["2".repeat(64)],
        )
      ).rows[0].result,
      "invalid",
    );
    await db.exec("reset role");
    assert.equal(
      (await db.query("select * from public.contact_messages")).rows.length,
      5,
    );
    await db.exec(
      "update public.site_settings set contact_form_enabled=false;set role service_role",
    );
    assert.equal((await call("2".repeat(64))).rows[0].result, "disabled");
    await db.exec("reset role");
    await db.exec("set role anon");
    await assert.rejects(db.exec("select * from public.contact_messages"));
    await assert.rejects(db.exec("select * from private.contact_rate_limits"));
    await db.exec("reset role");
  } finally {
    await db.close();
  }
});

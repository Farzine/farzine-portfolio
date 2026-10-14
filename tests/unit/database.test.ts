import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createTestDatabase } from "../../scripts/database";
import seed from "../../data/portfolio-seed.json";

const ADMIN = "00000000-0000-4000-8000-000000000001";
const denied = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === "42501";

const OTHER = "00000000-0000-4000-8000-000000000002";

test("migrations, repeatable draft import and real PostgreSQL role boundaries", async (t) => {
  const db = await createTestDatabase();
  try {
    const sql = readFileSync("supabase/seed.sql", "utf8");
    await db.exec(sql);
    await db.exec(
      `update public.projects set title='Owner edit' where slug='farm-ai'`,
    );
    await db.exec(sql);
    const count = await db.query<{ count: number }>(
      "select count(*)::integer as count from public.projects",
    );
    assert.equal(count.rows[0].count, 15);
    const changed = await db.query<{ title: string; status: string }>(
      `select title,status from public.projects where slug='farm-ai'`,
    );
    assert.equal(changed.rows[0].title, "Owner edit");
    assert.equal(changed.rows[0].status, "draft");
    await db.exec(
      `insert into auth.users(id) values ('${ADMIN}'),('${OTHER}'); insert into public.admin_profiles(user_id) values ('${ADMIN}');`,
    );
    await db.exec(
      `update public.projects set status='published' where slug='farm-ai'; insert into public.projects(title,slug,status) values('Archived','archived','archived');`,
    );
    const setRole = async (role: "anon" | "authenticated", id = "") => {
      await db.exec("reset role");
      await db.query(`select set_config('request.jwt.claim.sub',$1,false)`, [
        id,
      ]);
      await db.exec(`set role ${role}`);
    };
    for (const [label, role, id] of [
      ["anonymous", "anon", ""],
      ["nonadmin", "authenticated", OTHER],
    ] as const) {
      await t.test(
        `${label}: published only, no private reads/writes or privilege escalation`,
        async () => {
          await setRole(role, id);
          const publicRows = await db.query<{ slug: string }>(
            "select slug from public.projects",
          );
          assert.deepEqual(publicRows.rows, [{ slug: "farm-ai" }]);
          assert.equal(
            (await db.query("select * from public.profile_facts")).rows.length,
            0,
          );
          for (const table of [
            "site_settings",
            "section_settings",
            "experiences",
            "education",
            "certifications",
            "achievements",
            "skill_groups",
            "skills",
            "interests",
            "social_links",
            "navigation_items",
            "media_assets",
            "project_media",
          ]) {
            assert.equal(
              (await db.query(`select * from public.${table}`)).rows.length,
              0,
              table,
            );
            const source =
              table in seed
                ? Object.entries(seed).find(([key]) => key === table)?.[1]?.[0]
                : null;
            if (source) {
              const row: Record<string, unknown> = {
                ...source,
                id: randomUUID(),
              };
              if (table === "site_settings") row.id = 1;
              if (table === "skills") row.name = "Attack skill";
              const columns = Object.keys(row);
              await assert.rejects(
                db.query(
                  `insert into public.${table} (${columns.join(",")}) values (${columns.map((_, i) => `$${i + 1}`).join(",")})`,
                  Object.values(row),
                ),
                denied,
              );
            }
          }
          await assert.rejects(
            db.exec(
              `insert into public.projects(title,slug) values('Attack','attack')`,
            ),
            denied,
          );
          if (role === "anon") {
            await assert.rejects(
              db.exec(`update public.projects set title='Attack'`),
            );
            await assert.rejects(
              db.exec("select * from public.contact_messages"),
            );
          } else {
            assert.equal(
              (
                await db.query(
                  `update public.projects set title='Attack' returning id`,
                )
              ).rows.length,
              0,
            );
            assert.equal(
              (await db.query("select * from public.contact_messages")).rows
                .length,
              0,
            );
            assert.equal(
              (await db.query("select * from public.admin_profiles")).rows
                .length,
              0,
            );
          }
          await assert.rejects(
            db.exec(
              `insert into public.contact_messages(name,email,message) values('Attack','a@b.c','Attack message')`,
            ),
          );
          await assert.rejects(
            db.exec(
              `insert into public.admin_profiles(user_id) values('${OTHER}')`,
            ),
            denied,
          );
          await assert.rejects(
            db.exec(
              `insert into storage.objects(bucket_id,name) values('portfolio-public','attack.html')`,
            ),
            denied,
          );
          assert.equal(
            (await db.query(`select * from storage.objects`)).rows.length,
            0,
          );
        },
      );
    }
    await t.test(
      "admin can manage content and storage but cannot provision admins",
      async () => {
        await setRole("authenticated", ADMIN);
        assert.equal(
          (await db.query("select * from public.projects")).rows.length,
          16,
        );
        await db.exec(
          `insert into public.projects(title,slug) values('Admin-created','admin-created')`,
        );
        await db.exec(
          `update public.projects set status='published' where slug='admin-created'`,
        );
        await db.exec(`delete from public.projects where slug='admin-created'`);
        await db.exec(
          `insert into storage.objects(bucket_id,name) values('portfolio-public','admin-image.png')`,
        );
        await db.exec(
          `update storage.objects set name='replacement.png' where name='admin-image.png'`,
        );
        await db.exec(
          `delete from storage.objects where name='replacement.png'`,
        );
        assert.equal(
          (await db.query("select * from public.profile_facts")).rows.length,
          8,
        );
        await assert.rejects(
          db.exec(
            `insert into public.admin_profiles(user_id) values('${OTHER}')`,
          ),
        );
        await assert.rejects(
          db.exec(
            `update public.projects set demo_url='javascript:alert(1)' where slug='farm-ai'`,
          ),
        );
        await assert.rejects(
          db.exec(
            `insert into public.projects(title,slug) values('Duplicate','farm-ai')`,
          ),
        );
        await assert.rejects(
          db.exec(
            `insert into public.projects(title,slug) values('Invalid','../private')`,
          ),
        );
      },
    );
    await t.test(
      "media/gallery and private storage enforce meaningful read boundaries",
      async () => {
        await db.exec("reset role");
        const privateMedia = randomUUID();
        const publicMedia = randomUUID();
        await db.query(
          `insert into public.media_assets(id,bucket,object_path,mime_type,byte_size,is_public) values($1,'portfolio-private',$2,'image/png',100,false),($3,'portfolio-public',$4,'image/png',100,true)`,
          [
            privateMedia,
            `${ADMIN}/${privateMedia}.png`,
            publicMedia,
            `${ADMIN}/${publicMedia}.png`,
          ],
        );
        const publishedProject = seed.projects.find(
          (p) => p.slug === "farm-ai",
        )?.id;
        const draftProject = seed.projects.find(
          (p) => p.slug === "gsa-sust",
        )?.id;
        assert.ok(publishedProject && draftProject);
        await db.query(
          `insert into public.project_media(project_id,media_id) values($1,$2),($1,$3),($4,$3)`,
          [publishedProject, privateMedia, publicMedia, draftProject],
        );
        await db.exec(
          `insert into storage.objects(bucket_id,name) values('portfolio-private','confidential.png'),('portfolio-public','approved.png')`,
        );
        for (const [role, id] of [
          ["anon", ""],
          ["authenticated", OTHER],
        ] as const) {
          await setRole(role, id);
          const media = await db.query<{ id: string }>(
            "select id from public.media_assets",
          );
          assert.deepEqual(media.rows, [{ id: publicMedia }]);
          const gallery = await db.query<{
            project_id: string;
            media_id: string;
          }>("select project_id,media_id from public.project_media");
          assert.deepEqual(gallery.rows, [
            { project_id: publishedProject, media_id: publicMedia },
          ]);
          assert.equal(
            (await db.query("select * from storage.objects")).rows.length,
            0,
          );
        }
        await setRole("authenticated", ADMIN);
        assert.equal(
          (await db.query("select * from storage.objects")).rows.length,
          2,
        );
        await assert.rejects(
          db.query("delete from public.media_assets where id=$1", [
            publicMedia,
          ]),
          (error: unknown) =>
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "23001",
        );
      },
    );
    await t.test(
      "child publication and public facts require explicit approval",
      async () => {
        await db.exec("reset role");
        const group = seed.skill_groups[0].id;
        await db.query(
          `update public.skills set status='published' where group_id=$1`,
          [group],
        );
        await setRole("anon");
        assert.equal(
          (await db.query("select * from public.skills")).rows.length,
          0,
        );
        await db.exec("reset role");
        await db.query(
          `update public.skill_groups set status='published' where id=$1`,
          [group],
        );
        await db.query(
          `update public.profile_facts set is_public=true where id=$1`,
          [seed.profile_facts[0].id],
        );
        await setRole("anon");
        assert.equal(
          (await db.query("select * from public.skills")).rows.length,
          9,
        );
        assert.equal(
          (await db.query("select * from public.profile_facts")).rows.length,
          1,
        );
      },
    );
    await t.test(
      "all public tables have RLS and anon has no write privileges",
      async () => {
        await db.exec("reset role");
        const { rows } = await db.query<{
          relname: string;
          relrowsecurity: boolean;
        }>(
          `select c.relname,c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'`,
        );
        assert.equal(rows.length, 17);
        assert.ok(rows.every((r) => r.relrowsecurity));
        for (const row of rows) {
          const privileges = await db.query<{ allowed: boolean }>(
            `select has_table_privilege('anon',$1,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') as allowed`,
            [`public.${row.relname}`],
          );
          assert.equal(privileges.rows[0].allowed, false, row.relname);
        }
      },
    );
  } finally {
    await db.close();
  }
});

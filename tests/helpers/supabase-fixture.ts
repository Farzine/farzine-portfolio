/** Isolated HTTP test double; PostgreSQL grants/RLS are real, Auth is simulated. */
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import {
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { readFileSync } from "node:fs";
import { createTestDatabase } from "../../scripts/database";
export const ADMIN_ID = "00000000-0000-4000-8000-000000000001";
export const MEMBER_ID = "00000000-0000-4000-8000-000000000002";
export const TEST_PASSWORD = "test-fixture-password";
export async function startSupabaseFixture(
  port: number,
  afterReset?: () => Promise<void>,
) {
  const db = await createTestDatabase();
  const signingKey = randomBytes(32);
  const requests = new Map<string, number>();
  let failContact = false;
  const revoked = new Set<string>();
  const refreshTokens = new Map<string, string>();
  const metadata = await db.query<{ table_name: string; column_name: string }>(
    `select table_name,column_name from information_schema.columns where table_schema='public'`,
  );
  const columns = new Map<string, Set<string>>();
  for (const row of metadata.rows) {
    if (!columns.has(row.table_name)) columns.set(row.table_name, new Set());
    columns.get(row.table_name)?.add(row.column_name);
  }
  const storedFiles = new Map<string, { bytes: Buffer; type: string }>();
  const signedFiles = new Map<string, { key: string; expires: number }>();
  const tables = [...columns.keys()];
  async function reset() {
    await db.exec(
      `truncate ${tables.map((table) => `public.${table}`).join(",")} cascade; truncate auth.users cascade;`,
    );
    await db.exec(readFileSync("supabase/seed.sql", "utf8"));
    await db.query("insert into auth.users(id) values ($1),($2)", [
      ADMIN_ID,
      MEMBER_ID,
    ]);
    await db.query("insert into public.admin_profiles(user_id) values ($1)", [
      ADMIN_ID,
    ]);
    requests.clear();
    failContact = false;
    await db.exec("truncate private.contact_rate_limits");
    storedFiles.clear();
    signedFiles.clear();
    revoked.clear();
    refreshTokens.clear();
  }
  await reset();
  function user(id: string) {
    return {
      id,
      aud: "authenticated",
      role: "authenticated",
      email: id === ADMIN_ID ? "owner@example.test" : "member@example.test",
      app_metadata: { provider: "email" },
      user_metadata: { role: "admin" },
      created_at: "2026-01-01T00:00:00Z",
    };
  }
  function session(id: string) {
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(
      JSON.stringify({ alg: "HS256", typ: "JWT" }),
    ).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        sub: id,
        aud: "authenticated",
        role: "authenticated",
        exp: now + 3600,
        iat: now,
        iss: `http://127.0.0.1:${port}/auth/v1`,
      }),
    ).toString("base64url");
    const unsigned = `${header}.${payload}`;
    const access_token = `${unsigned}.${createHmac("sha256", signingKey).update(unsigned).digest("base64url")}`;
    const refresh_token = randomUUID();
    refreshTokens.set(refresh_token, id);
    return {
      access_token,
      refresh_token,
      token_type: "bearer",
      expires_in: 3600,
      expires_at: now + 3600,
      user: user(id),
    };
  }
  function identity(token: string): string | null {
    try {
      const [header, payload, signature] = token.split(".");
      if (!header || !payload || !signature) return null;
      const expected = createHmac("sha256", signingKey)
        .update(`${header}.${payload}`)
        .digest();
      const actual = Buffer.from(signature, "base64url");
      if (
        actual.length !== expected.length ||
        !timingSafeEqual(actual, expected)
      )
        return null;
      const claims: unknown = JSON.parse(
        Buffer.from(payload, "base64url").toString(),
      );
      if (
        typeof claims !== "object" ||
        claims === null ||
        !("sub" in claims) ||
        !("exp" in claims) ||
        typeof claims.sub !== "string" ||
        typeof claims.exp !== "number"
      )
        return null;
      if (
        ![ADMIN_ID, MEMBER_ID].includes(claims.sub) ||
        claims.exp <= Date.now() / 1000 ||
        revoked.has(claims.sub)
      )
        return null;
      return claims.sub;
    } catch {
      return null;
    }
  }
  async function body(req: IncomingMessage): Promise<unknown> {
    let text = "";
    for await (const chunk of req) {
      text += chunk;
      if (text.length > 1048576) throw new Error("Request too large.");
    }
    return text ? JSON.parse(text) : {};
  }
  function json(res: ServerResponse, status: number, value: unknown) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(value));
  }
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
      if (url.pathname === "/__test/reset" && req.method === "POST") {
        await reset();
        await afterReset?.();
        json(res, 200, { ok: true });
        return;
      }
      if (url.pathname === "/__test/fail-contact" && req.method === "POST") {
        failContact = true;
        json(res, 200, { ok: true });
        return;
      }
      if (url.pathname === "/__test/requests") {
        json(res, 200, Object.fromEntries(requests));
        return;
      }
      if (url.pathname === "/__test/project-count") {
        const count = await db.query<{ count: number }>(
          "select count(*)::integer as count from public.projects",
        );
        json(res, 200, count.rows[0]);
        return;
      }
      if (url.pathname === "/__test/revoke" && req.method === "POST") {
        revoked.add(ADMIN_ID);
        json(res, 200, { ok: true });
        return;
      }
      if (url.pathname === "/auth/v1/token" && req.method === "POST") {
        const value = await body(req);
        if (typeof value !== "object" || value === null) {
          json(res, 400, { code: "invalid_credentials" });
          return;
        }
        if (url.searchParams.get("grant_type") === "refresh_token") {
          const id =
            "refresh_token" in value && typeof value.refresh_token === "string"
              ? refreshTokens.get(value.refresh_token)
              : null;
          if (!id || revoked.has(id)) {
            json(res, 401, {
              code: "refresh_token_not_found",
              message: "Invalid refresh token",
            });
            return;
          }
          json(res, 200, session(id));
          return;
        }
        if (
          !("email" in value) ||
          !("password" in value) ||
          value.password !== TEST_PASSWORD ||
          !["owner@example.test", "member@example.test"].includes(
            String(value.email),
          )
        ) {
          json(res, 400, {
            code: "invalid_credentials",
            message: "Invalid login credentials",
          });
          return;
        }
        json(
          res,
          200,
          session(value.email === "owner@example.test" ? ADMIN_ID : MEMBER_ID),
        );
        return;
      }
      const token = req.headers.authorization?.replace(/^Bearer /i, "") ?? "";
      const id = identity(token);
      if (url.pathname === "/auth/v1/user") {
        json(
          res,
          id ? 200 : 401,
          id ? user(id) : { code: "bad_jwt", message: "Invalid session" },
        );
        return;
      }
      if (url.pathname === "/auth/v1/logout") {
        json(res, 200, {});
        return;
      }
      if (url.pathname === "/auth/v1/.well-known/jwks.json") {
        json(res, 200, { keys: [] });
        return;
      }
      if (url.pathname.startsWith("/storage/v1/object/")) {
        const parts = url.pathname
          .slice("/storage/v1/object/".length)
          .split("/");
        if (
          parts[0] === "public" ||
          (parts[0] === "sign" && req.method === "GET")
        ) {
          const mode = parts.shift();
          const bucket = parts.shift();
          const key = `${bucket}/${parts.join("/")}`;
          const signed = signedFiles.get(url.searchParams.get("token") ?? "");
          const permitted =
            mode === "public"
              ? bucket === "portfolio-public"
              : signed?.key === key && signed.expires > Date.now();
          const file = permitted ? storedFiles.get(key) : null;
          if (!file) {
            json(res, 404, { message: "Asset unavailable" });
            return;
          }
          res.writeHead(200, {
            "Content-Type": file.type,
            "Content-Disposition": "attachment",
            "X-Content-Type-Options": "nosniff",
          });
          res.end(file.bytes);
          return;
        }
        const signing = parts[0] === "sign";
        if (signing) parts.shift();
        const bucket = parts.shift();
        const path = parts.join("/");
        const key = `${bucket}/${path}`;
        const storedQuery = async (statement: string, values: unknown[]) =>
          db.transaction(async (tx) => {
            await tx.query(
              "select set_config('request.jwt.claim.sub',$1,true)",
              [id ?? ""],
            );
            await tx.exec(`set local role ${id ? "authenticated" : "anon"}`);
            return tx.query(statement, values);
          });
        if (signing && req.method === "POST") {
          const permitted = await storedQuery(
            "select id from storage.objects where bucket_id=$1 and name=$2",
            [bucket, path],
          );
          if (!permitted.rows.length) {
            json(res, 403, { message: "Asset unavailable" });
            return;
          }
          const signature = randomUUID();
          signedFiles.set(signature, { key, expires: Date.now() + 60000 });
          json(res, 200, {
            signedURL: `/object/sign/${key}?token=${signature}`,
          });
          return;
        }
        if (req.method === "POST") {
          const chunks: Buffer[] = [];
          let size = 0;
          for await (const chunk of req) {
            const bytes = Buffer.from(chunk);
            size += bytes.length;
            if (size > 4 * 1024 * 1024) throw new Error("Request too large");
            chunks.push(bytes);
          }
          await storedQuery(
            "insert into storage.objects(bucket_id,name) values($1,$2)",
            [bucket, path],
          );
          storedFiles.set(key, {
            bytes: Buffer.concat(chunks),
            type: String(
              req.headers["content-type"] ?? "application/octet-stream",
            ),
          });
          json(res, 200, { Key: key, Id: randomUUID() });
          return;
        }
        if (req.method === "DELETE") {
          const input = await body(req);
          if (
            typeof input !== "object" ||
            !input ||
            !("prefixes" in input) ||
            !Array.isArray(input.prefixes) ||
            !input.prefixes.every((value) => typeof value === "string")
          )
            throw new Error("Unsupported storage removal");
          const removed = [];
          for (const prefix of input.prefixes) {
            const result = await storedQuery(
              "delete from storage.objects where bucket_id=$1 and name=$2 returning name",
              [bucket, prefix],
            );
            if (result.rows.length) {
              storedFiles.delete(`${bucket}/${prefix}`);
              removed.push({ name: prefix });
            }
          }
          json(res, 200, removed);
          return;
        }
        json(res, 404, { message: "Unsupported storage operation" });
        return;
      }
      if (
        url.pathname === "/rest/v1/rpc/submit_contact_message" &&
        req.method === "POST"
      ) {
        if (failContact) {
          failContact = false;
          json(res, 503, {
            code: "TEST_STORAGE_FAILURE",
            message: "Test storage failure",
          });
          return;
        }
        const input = await body(req);
        if (
          typeof input !== "object" ||
          !input ||
          !("sender_name" in input) ||
          !("sender_email" in input) ||
          !("body_text" in input) ||
          !("rate_key" in input)
        )
          throw new Error("Invalid RPC arguments");
        const result = await db.transaction(async (tx) => {
          await tx.exec(
            `set local role ${token === "sb_secret_test-only" ? "service_role" : id ? "authenticated" : "anon"}`,
          );
          return tx.query<{ result: string }>(
            "select public.submit_contact_message($1,$2,$3,$4) as result",
            [
              input.sender_name,
              input.sender_email,
              input.body_text,
              input.rate_key,
            ],
          );
        });
        json(res, 200, result.rows[0].result);
        return;
      }
      const table = url.pathname.replace("/rest/v1/", "");
      const allowed = columns.get(table);
      if (url.pathname.startsWith("/rest/v1/") && allowed) {
        const label = `${id === ADMIN_ID ? "owner" : id ? "member" : "anon"}:${req.method}:${table}`;
        requests.set(label, (requests.get(label) ?? 0) + 1);
      }
      if (!url.pathname.startsWith("/rest/v1/") || !allowed) {
        json(res, 404, { message: "Unknown test endpoint" });
        return;
      }
      if (token && token !== "sb_publishable_test-only" && !id) {
        json(res, 401, { code: "PGRST301", message: "Invalid session" });
        return;
      }
      const select = url.searchParams.get("select") ?? "*";
      if (
        select !== "*" &&
        select.split(",").some((column) => !allowed.has(column))
      )
        throw new Error("Unsupported test projection.");
      const values: unknown[] = [];
      const where: string[] = [];
      for (const [column, filter] of url.searchParams) {
        if (["select", "order", "limit", "offset"].includes(column)) continue;
        if (!allowed.has(column)) throw new Error("Unsupported test filter.");
        if (filter.startsWith("eq.")) {
          values.push(filter.slice(3));
          where.push(`${column}=$${values.length}`);
        } else if (filter.startsWith("in.(") && filter.endsWith(")")) {
          const choices = filter.slice(4, -1).split(",");
          const slots = choices.map((choice) => {
            values.push(choice);
            return `$${values.length}`;
          });
          where.push(`${column} in (${slots.join(",")})`);
        } else throw new Error("Unsupported test filter.");
      }
      let order = "";
      const requestedOrder = url.searchParams.get("order");
      if (requestedOrder) {
        const parts = requestedOrder.split(",").map((part) => {
          const match = /^(\w+)\.(asc|desc)(?:\.nulls(?:first|last))?$/.exec(
            part,
          );
          if (!match || !allowed.has(match[1]))
            throw new Error("Unsupported test sort.");
          return `${match[1]} ${match[2]}`;
        });
        order = ` order by ${parts.join(",")}`;
      }
      const predicate = where.length ? ` where ${where.join(" and ")}` : "";
      const method = req.method ?? "GET";
      const input =
        method === "POST" || method === "PATCH" ? await body(req) : null;
      let statement: string;
      if (method === "GET" || method === "HEAD")
        statement = `select ${select} from public.${table}${predicate}${order}`;
      else if (method === "DELETE")
        statement = `delete from public.${table}${predicate} returning ${select}`;
      else if (
        (method === "POST" || method === "PATCH") &&
        typeof input === "object" &&
        input !== null &&
        !Array.isArray(input)
      ) {
        const entries = Object.entries(input);
        if (!entries.length || entries.some(([key]) => !allowed.has(key)))
          throw new Error("Unsupported test write.");
        const placeholders = entries.map(([, value]) => {
          values.push(value);
          return `$${values.length}`;
        });
        statement =
          method === "POST"
            ? `insert into public.${table} (${entries.map(([key]) => key).join(",")}) values (${placeholders.join(",")}) returning ${select}`
            : `update public.${table} set ${entries.map(([key], index) => `${key}=${placeholders[index]}`).join(",")}${predicate} returning ${select}`;
      } else throw new Error("Unsupported test operation.");
      if (method === "GET" || method === "HEAD") {
        const limit = url.searchParams.get("limit");
        const offset = url.searchParams.get("offset");
        if (limit) {
          if (!/^\d+$/.test(limit)) throw new Error("Invalid limit");
          statement += ` limit ${Number(limit)}`;
        }
        if (offset) {
          if (!/^\d+$/.test(offset)) throw new Error("Invalid offset");
          statement += ` offset ${Number(offset)}`;
        }
      }
      const result = await db.transaction(async (tx) => {
        await tx.query(`select set_config('request.jwt.claim.sub',$1,true)`, [
          id ?? "",
        ]);
        await tx.exec(`set local role ${id ? "authenticated" : "anon"}`);
        return tx.query(statement, values);
      });
      const single = req.headers.accept?.includes(
        "application/vnd.pgrst.object+json",
      );
      if (single && result.rows.length !== 1) {
        json(res, 406, {
          code: "PGRST116",
          details: `The result contains ${result.rows.length} rows`,
          message: "JSON object requested, multiple (or no) rows returned",
        });
        return;
      }
      json(
        res,
        method === "POST" ? 201 : 200,
        single ? result.rows[0] : result.rows,
      );
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String(error.code)
          : "TEST_FIXTURE_ERROR";
      console.error("Test fixture request failed", { code });
      json(res, code === "42501" ? 403 : 400, {
        code,
        message: "Test request rejected.",
      });
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  return {
    async close() {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      await db.close();
    },
  };
}

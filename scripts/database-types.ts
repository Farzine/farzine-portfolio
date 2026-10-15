import { writeFileSync, readFileSync } from "node:fs";
import { createTestDatabase } from "./database";
export async function generateDatabaseTypes() {
  const db = await createTestDatabase();
  try {
    const { rows: columns } = await db.query<{
      table_name: string;
      column_name: string;
      udt_name: string;
      is_nullable: string;
      column_default: string | null;
    }>(
      `select table_name,column_name,udt_name,is_nullable,column_default from information_schema.columns where table_schema='public' order by table_name,ordinal_position`,
    );
    const { rows: enums } = await db.query<{ name: string; label: string }>(
      `select t.typname as name,e.enumlabel as label from pg_type t join pg_enum e on e.enumtypid=t.oid order by t.typname,e.enumsortorder`,
    );
    const enumNames = [...new Set(enums.map((e) => e.name))];
    const lines = [
      "// Generated from applied migrations by npm run db:types; do not edit manually.",
      "export type Database = { public: { Tables: {",
    ];
    for (const table of [...new Set(columns.map((c) => c.table_name))]) {
      lines.push(`${table}: {`);
      for (const mode of ["Row", "Insert", "Update"]) {
        lines.push(`${mode}: {`);
        for (const c of columns.filter((c) => c.table_name === table)) {
          const base = enumNames.includes(c.udt_name)
            ? `Database['public']['Enums']['${c.udt_name}']`
            : c.udt_name === "_text"
              ? "string[]"
              : c.udt_name === "bool"
                ? "boolean"
                : [
                      "int2",
                      "int4",
                      "int8",
                      "float4",
                      "float8",
                      "numeric",
                    ].includes(c.udt_name)
                  ? "number"
                  : "string";
          const optional =
            mode === "Update" ||
            (mode === "Insert" &&
              (c.column_default !== null || c.is_nullable === "YES"));
          lines.push(
            `${c.column_name}${optional ? "?" : ""}: ${base}${c.is_nullable === "YES" ? " | null" : ""};`,
          );
        }
        lines.push("};");
      }
      const { rows: relations } = await db.query<{
        name: string;
        column_name: string;
        target: string;
        target_column: string;
      }>(
        `select con.conname as name,a.attname as column_name,target.relname as target,ta.attname as target_column from pg_constraint con join pg_class source on source.oid=con.conrelid join pg_namespace ns on ns.oid=source.relnamespace join pg_class target on target.oid=con.confrelid join pg_attribute a on a.attrelid=source.oid and a.attnum=con.conkey[1] join pg_attribute ta on ta.attrelid=target.oid and ta.attnum=con.confkey[1] where con.contype='f' and ns.nspname='public' and source.relname=$1 order by con.conname`,
        [table],
      );
      lines.push(
        `Relationships: [${relations.map((r) => `{ foreignKeyName: '${r.name}'; columns: ['${r.column_name}']; isOneToOne: ${table === "admin_profiles"}; referencedRelation: '${r.target}'; referencedColumns: ['${r.target_column}']; }`).join(",")}];`,
      );
      lines.push("};");
    }
    lines.push("}; Views: { [_ in never]: never }; Functions: {");
    const { rows: functions } = await db.query<{
      name: string;
      args: string[];
      types: string;
      return_type: string;
    }>(
      `select p.proname as name,p.proargnames as args,oidvectortypes(p.proargtypes) as types,format_type(p.prorettype,null) as return_type from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' order by p.proname`,
    );
    const scalarType = (type: string) =>
      type === "boolean" ? "boolean" : type === "integer" ? "number" : "string";
    for (const fn of functions) {
      const types = fn.types.split(",").map((type) => type.trim());
      lines.push(
        `${fn.name}: { Args: { ${fn.args.map((name, i) => `${name}: ${scalarType(types[i])};`).join(" ")} }; Returns: ${scalarType(fn.return_type)}; };`,
      );
    }
    lines.push("}; Enums: {");
    for (const name of enumNames)
      lines.push(
        `${name}: ${enums
          .filter((e) => e.name === name)
          .map((e) => `'${e.label}'`)
          .join(" | ")};`,
      );
    lines.push(
      "}; CompositeTypes: { [_ in never]: never }; } };",
      `export type TableName = keyof Database['public']['Tables'];`,
      `export type Row<T extends TableName> = Database['public']['Tables'][T]['Row'];`,
      `export type Insert<T extends TableName> = Database['public']['Tables'][T]['Insert'];`,
      `export type Update<T extends TableName> = Database['public']['Tables'][T]['Update'];`,
    );
    return `${lines.join("\n")}\n`;
  } finally {
    await db.close();
  }
}
if (process.argv[1]?.endsWith("database-types.ts")) {
  const generated = await generateDatabaseTypes();
  if (process.argv.includes("--check")) {
    const current = readFileSync("lib/types/database.generated.ts", "utf8");
    if (current !== generated)
      throw new Error(
        "Database types differ from applied migrations. Run npm run db:types.",
      );
    console.log("Database types match applied migrations.");
  } else {
    writeFileSync("lib/types/database.generated.ts", generated);
    console.log("Database types generated from applied migrations.");
  }
}

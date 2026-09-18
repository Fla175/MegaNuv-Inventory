const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

// Exercise the actual loop without importing Next.js, Prisma or credentials.
const source = readFileSync(join(__dirname, "../pages/api/database/revert.ts"), "utf8");
const start = source.indexOf("  for (const [id, versions] of groupedById) {");
const end = source.indexOf("\n  // Ordena do mais recente", start);
assert.ok(start >= 0 && end > start);
const loop = source.slice(start, end)
  .replace(/let action: [^;]+;/, "let action;")
  .replace("let revertTimestamp: Date;", "let revertTimestamp;")
  .replace("let name: string;", "let name;");
const max = source.match(/const SYSTEM_TIME_MAX = "([^"]+)";/)[1];
const classify = new Function("groupedById", "SYSTEM_TIME_MAX", `const rawItems = [];\n${loop}\nreturn rawItems;`);
const time = (second) => new Date(Date.UTC(2026, 8, 18, 12, 0, second));
const row = (start, end, fatherSpaceId = "space-a", extra = {}) => ({
  id: "test", name: "Test asset", ROW_START: time(start),
  ROW_END: end === null ? new Date(max) : time(end), fatherSpaceId, ...extra,
});
const run = (...versions) => classify(new Map([["test", versions]]), max);

test("single live version has no reversible previous state", () => {
  assert.deepEqual(run(row(0, null)), []);
});
test("first move takes precedence over CREATE, with descending input", () => {
  const [item] = run(row(2, null, "space-b"), row(0, 2));
  assert.equal(item.action, "MOVE");
  assert.equal(item.timestamp, new Date(time(2).getTime() - 1).toISOString());
});
test("later move and later edit use the chronological predecessor", () => {
  assert.equal(run(row(4, null, "space-b"), row(0, 2), row(2, 4))[0].action, "MOVE");
  assert.equal(run(row(2, 4), row(4, null), row(0, 2))[0].action, "UPDATE");
});
test("requested first-edit classification remains CREATE", () => {
  assert.equal(run(row(0, 2), row(2, null))[0].action, "CREATE");
});
test("deleted multi-version asset uses final version end", () => {
  const [item] = run(row(2, 4), row(0, 2));
  assert.equal(item.action, "DELETE");
  assert.equal(item.timestamp, new Date(time(4).getTime() - 1).toISOString());
});
test("requested single deleted version classification remains CREATE", () => {
  assert.equal(run(row(0, 2))[0].action, "CREATE");
});
test("parentId fallback detects move when fatherSpaceId is absent", () => {
  assert.equal(run(row(0, 2, null, { parentId: "a" }), row(2, null, null, { parentId: "b" }))[0].action, "MOVE");
});
test("known limitation: populated fatherSpaceId masks parentId changes", () => {
  assert.equal(run(row(0, 2, "space-a", { parentId: "a" }), row(2, null, "space-a", { parentId: "b" }))[0].action, "CREATE");
});

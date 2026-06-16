import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { cp, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const root = new URL("..", import.meta.url);

test("run.sh dispatches real validation commands with clear failures", async () => {
  const fixture = await createFixture();

  try {
    assert.equal(run(fixture, "check").status, 0);
    assert.equal(
      readFileSync(join(fixture, "target.js"), "utf8"),
      "const ok = true;\n",
    );

    assert.equal(run(fixture, "format").status, 0);
    assert.equal(run(fixture, "test").status, 0);
    assert.equal(run(fixture, "e2e-tests").status, 0);
    assert.equal(run(fixture, "build").status, 0);
    assert.deepEqual(readLog(fixture), [
      "check",
      "format",
      "test",
      "e2e-tests",
      "build",
    ]);

    const unknown = run(fixture, "wat");
    assert.notEqual(unknown.status, 0);
    assert.match(unknown.stderr, /Usage:/);

    writeFileSync(join(fixture, ".fail-check"), "");
    const failed = run(fixture, "check");
    assert.notEqual(failed.status, 0);
  } finally {
    rmSync(fixture, { force: true, recursive: true });
  }
});

test("run.sh keeps check non-mutating and format mutating", async () => {
  const fixture = await createFixture();
  const target = join(fixture, "target.js");

  try {
    writeFileSync(target, "const ok=true\n");

    const checked = run(fixture, "check");
    assert.notEqual(checked.status, 0);
    assert.equal(readFileSync(target, "utf8"), "const ok=true\n");

    assert.equal(run(fixture, "format").status, 0);
    assert.equal(readFileSync(target, "utf8"), "const ok = true;\n");
  } finally {
    rmSync(fixture, { force: true, recursive: true });
  }
});

test("run.sh check reports fixable lint while format fixes it", async () => {
  const fixture = await createPackageScriptFixture();
  const target = join(fixture, "src/lint-target.js");
  const lintIssue = "const pattern = /foo  bar/;\nconsole.log(pattern);\n";
  const fixed = "const pattern = /foo {2}bar/;\nconsole.log(pattern);\n";

  try {
    writeFileSync(target, lintIssue);

    const checked = run(fixture, "check");
    assert.notEqual(checked.status, 0);
    assert.match(checked.stdout + checked.stderr, /no-regex-spaces/);
    assert.equal(readFileSync(target, "utf8"), lintIssue);

    assert.equal(run(fixture, "format").status, 0);
    assert.equal(readFileSync(target, "utf8"), fixed);
  } finally {
    rmSync(fixture, { force: true, recursive: true });
  }
});

test("behavior-unit coverage gate rejects low behavior coverage despite e2e data", async () => {
  const fixture = mkdtempSync(join(tmpdir(), "portfolio-coverage-"));

  try {
    await mkdir(join(fixture, "src"), { recursive: true });
    await mkdir(join(fixture, "tests/behavior"), { recursive: true });
    await mkdir(join(fixture, "coverage/e2e"), { recursive: true });
    await writeFile(
      join(fixture, "src/behavior.js"),
      `
export function covered() {
  return "covered";
}

export function uncovered() {
  return "uncovered";
}
`,
    );
    await writeFile(
      join(fixture, "tests/behavior/behavior.test.js"),
      `
import { expect, test } from "vitest";
import { covered } from "../../src/behavior.js";

test("covered behavior", () => {
  expect(covered()).toBe("covered");
});
`,
    );
    await writeFile(join(fixture, "coverage/e2e/lcov.info"), "TN:e2e\n");
    await writeFile(
      join(fixture, "vitest.config.js"),
      `
export default {
  test: {
    coverage: {
      all: true,
      include: ["src/behavior.js"],
      provider: "v8",
      reportsDirectory: "coverage/behavior-unit",
      reporter: ["text"],
      thresholds: {
        lines: 90,
      },
    },
    environment: "node",
    include: ["tests/behavior/**/*.test.js"],
  },
};
`,
    );

    const lowCoverage = spawnSync(
      join(root.pathname, "node_modules/.bin/vitest"),
      ["run", "--coverage", "--config", "vitest.config.js"],
      { cwd: fixture, encoding: "utf8" },
    );

    assert.notEqual(lowCoverage.status, 0);
    assert.match(lowCoverage.stdout + lowCoverage.stderr, /Coverage for lines/);
  } finally {
    rmSync(fixture, { force: true, recursive: true });
  }
});

async function createFixture() {
  const fixture = mkdtempSync(join(tmpdir(), "portfolio-run-"));
  await cp(new URL("../run.sh", import.meta.url), join(fixture, "run.sh"));
  await mkdir(join(fixture, "scripts"));
  await writeFile(join(fixture, "target.js"), "const ok = true;\n");
  await writeFile(
    join(fixture, "package.json"),
    JSON.stringify({
      private: true,
      scripts: {
        build: "node scripts/script.js build",
        check: "node scripts/script.js check",
        "e2e-tests": "node scripts/script.js e2e-tests",
        format: "node scripts/script.js format",
        test: "node scripts/script.js test",
      },
      type: "module",
    }),
  );
  await writeFile(
    join(fixture, "scripts/script.js"),
    `
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const command = process.argv[2];
appendFileSync("commands.log", command + "\\n");

if (existsSync(".fail-" + command)) {
  process.exit(1);
}

if (command === "check") {
  process.exit(readFileSync("target.js", "utf8") === "const ok = true;\\n" ? 0 : 1);
}

if (command === "format") {
  writeFileSync("target.js", "const ok = true;\\n");
}
`,
  );

  return fixture;
}

async function createPackageScriptFixture() {
  const fixture = mkdtempSync(join(tmpdir(), "portfolio-package-scripts-"));
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  const fixturePackage = {
    engines: {
      node: "24.16.0",
    },
    packageManager: "npm@11.13.0",
    private: true,
    scripts: {
      check: packageJson.scripts.check,
      format: packageJson.scripts.format,
    },
    type: "module",
  };

  await cp(new URL("../run.sh", import.meta.url), join(fixture, "run.sh"));
  await cp(
    new URL("../eslint.config.js", import.meta.url),
    join(fixture, "eslint.config.js"),
  );
  await symlink(
    join(root.pathname, "node_modules"),
    join(fixture, "node_modules"),
  );
  await mkdir(join(fixture, "docs"));
  await mkdir(join(fixture, "src"));
  await mkdir(join(fixture, "tasks"));
  await mkdir(join(fixture, "tests"));
  await writeFile(join(fixture, ".gitignore"), "node_modules\n");
  await writeFile(join(fixture, "README.md"), "# Fixture\n");
  await writeFile(join(fixture, "docs/PROJECT.md"), "# Fixture\n");
  await writeFile(join(fixture, "config.js"), "export default {};\n");
  await writeFile(join(fixture, "index.html"), '<div id="app"></div>\n');
  await writeFile(
    join(fixture, "src/clean.js"),
    "const sourceOk = true;\nconsole.log(sourceOk);\n",
  );
  await writeFile(join(fixture, "tasks/todo.md"), "# Fixture\n");
  await writeFile(
    join(fixture, "tests/clean.js"),
    "const ok = true;\nconsole.log(ok);\n",
  );
  await writeFile(
    join(fixture, "vitest.config.js"),
    "export default { test: {} };\n",
  );
  await writeFile(
    join(fixture, "package.json"),
    `${JSON.stringify(fixturePackage, null, 2)}\n`,
  );
  await writeFile(
    join(fixture, "package-lock.json"),
    `${JSON.stringify(
      {
        packages: {
          "": {
            engines: fixturePackage.engines,
          },
        },
      },
      null,
      2,
    )}\n`,
  );

  return fixture;
}

function run(cwd, command) {
  return spawnSync("./run.sh", [command], { cwd, encoding: "utf8" });
}

function readLog(cwd) {
  return readFileSync(join(cwd, "commands.log"), "utf8").trim().split("\n");
}

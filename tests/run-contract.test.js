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

test("package validation covers repository scripts", async () => {
  const fixture = await createPackageScriptFixture();
  const target = join(fixture, "scripts/validation-target.js");
  const formatIssue = "const checked=true\nconsole.log(checked)\n";
  const fixed = "const checked = true;\nconsole.log(checked);\n";

  try {
    writeFileSync(target, formatIssue);

    const checked = run(fixture, "check");
    assert.notEqual(checked.status, 0);
    assert.match(checked.stdout + checked.stderr, /validation-target\.js/);
    assert.equal(readFileSync(target, "utf8"), formatIssue);

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

test("repository policy checker enforces reproducible runtime policy", async () => {
  const fixture = mkdtempSync(join(tmpdir(), "portfolio-policy-"));

  try {
    await writeValidPolicyFixture(fixture);
    assert.equal(runPolicyChecker(fixture).status, 0);

    for (const invalidPackage of [
      { ...validPackagePolicy(), packageManager: undefined },
      { ...validPackagePolicy(), dependencies: { vue: "^3.5.38" } },
    ]) {
      await writeFile(
        join(fixture, "package.json"),
        `${JSON.stringify(invalidPackage, null, 2)}\n`,
      );
      assert.notEqual(runPolicyChecker(fixture).status, 0);
    }

    await writeFile(
      join(fixture, "package.json"),
      `${JSON.stringify(validPackagePolicy(), null, 2)}\n`,
    );
    await writeFile(
      join(fixture, ".npmrc"),
      "engine-strict=true\nsave-exact=true\n",
    );
    assert.notEqual(runPolicyChecker(fixture).status, 0);
  } finally {
    rmSync(fixture, { force: true, recursive: true });
  }
});

test("repository policy checker enforces CI and Dependabot governance", async () => {
  const fixture = mkdtempSync(join(tmpdir(), "portfolio-ci-policy-"));

  try {
    await writeValidPolicyFixture(fixture);
    assert.equal(runPolicyChecker(fixture).status, 0);

    await writeFile(
      join(fixture, ".github/workflows/ci.yml"),
      validCiWorkflow().replace("./run.sh check", "npm run check"),
    );
    assert.notEqual(runPolicyChecker(fixture).status, 0);

    await writeFile(
      join(fixture, ".github/workflows/ci.yml"),
      validCiWorkflow().replace("name: ci/check", "name: validation/check"),
    );
    assert.notEqual(runPolicyChecker(fixture).status, 0);

    await writeFile(
      join(fixture, ".github/workflows/ci.yml"),
      validCiWorkflow().replace(
        "run: cp dist/index.html dist/404.html",
        "run: |\n          ./run.sh build\n          cp dist/index.html dist/404.html",
      ),
    );
    assert.notEqual(runPolicyChecker(fixture).status, 0);

    await writeFile(
      join(fixture, ".github/workflows/ci.yml"),
      validCiWorkflow().replace(
        "      - run: npm ci\n      - run: npm audit signatures --min-release-age=0",
        "      - run: npm audit signatures --min-release-age=0",
      ),
    );
    assert.notEqual(runPolicyChecker(fixture).status, 0);

    await writeFile(
      join(fixture, ".github/workflows/ci.yml"),
      validCiWorkflow().replace(
        "      - run: npm ci\n      - run: npm audit --audit-level=high",
        "      - run: npm audit --audit-level=high",
      ),
    );
    assert.notEqual(runPolicyChecker(fixture).status, 0);

    await writeFile(
      join(fixture, ".github/workflows/ci.yml"),
      validCiWorkflow().replace(
        "if: github.event_name == 'push' && github.ref == 'refs/heads/main'",
        "if: github.ref == 'refs/heads/main'",
      ),
    );
    assert.notEqual(runPolicyChecker(fixture).status, 0);

    await writeFile(
      join(fixture, ".github/workflows/ci.yml"),
      validCiWorkflow().replace(
        "      - check",
        "      - format\n      - check",
      ),
    );
    assert.notEqual(runPolicyChecker(fixture).status, 0);

    await writeFile(
      join(fixture, ".github/workflows/ci.yml"),
      validCiWorkflow(),
    );
    await writeFile(
      join(fixture, ".github/branch-protection.md"),
      validBranchProtectionDeferral().replace(
        "- ci/check",
        "- ci/format\n- ci/check",
      ),
    );
    assert.notEqual(runPolicyChecker(fixture).status, 0);

    await writeFile(
      join(fixture, ".github/branch-protection.md"),
      validBranchProtectionDeferral(),
    );
    await writeFile(
      join(fixture, ".github/dependabot.yml"),
      `${validDependabotConfig()}  - package-ecosystem: docker\n    directory: /\n    schedule:\n      interval: weekly\n`,
    );
    assert.notEqual(runPolicyChecker(fixture).status, 0);

    await writeFile(
      join(fixture, ".github/dependabot.yml"),
      validDependabotConfig(),
    );
    await writeFile(
      join(fixture, ".github/workflows/dependabot-automerge.yml"),
      validAutomergeWorkflow().replace(
        '"version-update:semver-patch", "version-update:semver-minor"].includes',
        '"version-update:semver-patch", "version-update:semver-minor", "version-update:semver-major"].includes',
      ),
    );
    assert.notEqual(runPolicyChecker(fixture).status, 0);

    await writeFile(
      join(fixture, ".github/workflows/dependabot-automerge.yml"),
      validAutomergeWorkflow().replace(
        'const allowedNpmSecurityPatch = metadata.ecosystem === "npm" && metadata.updateType === "security-update:semver-patch";\n          const allowedNpmOrDocker = ["npm", "npm_and_yarn", "docker"].includes(metadata.ecosystem) && ["version-update:semver-patch", "version-update:semver-minor"].includes(metadata.updateType);',
        'const allowedNpmOrDocker = ["npm", "npm_and_yarn", "docker"].includes(metadata.ecosystem) && ["version-update:semver-patch", "version-update:semver-minor", "security-update:semver-patch"].includes(metadata.updateType);',
      ),
    );
    assert.notEqual(runPolicyChecker(fixture).status, 0);

    await writeFile(
      join(fixture, ".github/workflows/dependabot-automerge.yml"),
      validAutomergeWorkflow().replace("workflow_run:", "workflow_call:"),
    );
    assert.notEqual(runPolicyChecker(fixture).status, 0);

    await writeFile(
      join(fixture, ".github/workflows/dependabot-automerge.yml"),
      validAutomergeWorkflow().replace(
        "      - uses: dependabot/fetch-metadata@v3",
        "      - uses: actions/checkout@v5\n      - uses: dependabot/fetch-metadata@v3",
      ),
    );
    assert.notEqual(runPolicyChecker(fixture).status, 0);

    await writeFile(
      join(fixture, ".github/workflows/dependabot-automerge.yml"),
      validAutomergeWorkflow().replaceAll("security-update:semver-patch", ""),
    );
    assert.notEqual(runPolicyChecker(fixture).status, 0);

    await writeFile(
      join(fixture, ".github/workflows/dependabot-automerge.yml"),
      `PERSONAL_ACCESS_TOKEN=token\n${validAutomergeWorkflow()}`,
    );
    assert.notEqual(runPolicyChecker(fixture).status, 0);

    await writeValidPolicyFixture(fixture);
    await writeFile(
      join(fixture, "package.json"),
      `${JSON.stringify(
        {
          ...validPackagePolicy(),
          dependencies: {
            ...validPackagePolicy().dependencies,
            "vue-masonry": "0.16.0",
          },
        },
        null,
        2,
      )}\n`,
    );
    assert.notEqual(runPolicyChecker(fixture).status, 0);

    await writeValidPolicyFixture(fixture);
    await writeFile(
      join(fixture, "src/components/home/InfiniteScrollContainer.vue"),
      "<template><div v-masonry></div></template>\n",
    );
    assert.notEqual(runPolicyChecker(fixture).status, 0);

    await writeValidPolicyFixture(fixture);
    await writeFile(
      join(fixture, "package.json"),
      `${JSON.stringify(
        {
          ...validPackagePolicy(),
          dependencies: {
            ...validPackagePolicy().dependencies,
            "core-js": "3.44.0",
          },
        },
        null,
        2,
      )}\n`,
    );
    assert.notEqual(runPolicyChecker(fixture).status, 0);

    await writeValidPolicyFixture(fixture);
    await writeFile(
      join(fixture, "package.json"),
      `${JSON.stringify(
        {
          ...validPackagePolicy(),
          devDependencies: {
            ...validPackagePolicy().devDependencies,
            vite: "8.0.15",
          },
        },
        null,
        2,
      )}\n`,
    );
    assert.notEqual(runPolicyChecker(fixture).status, 0);

    await writeValidPolicyFixture(fixture);
    await writeFile(
      join(fixture, "package.json"),
      `${JSON.stringify(
        {
          ...validPackagePolicy(),
          dependencies: {
            ...validPackagePolicy().dependencies,
            zod: "4.0.0",
          },
        },
        null,
        2,
      )}\n`,
    );
    assert.notEqual(runPolicyChecker(fixture).status, 0);

    await writeValidPolicyFixture(fixture);
    await writeFile(
      join(fixture, "src/legacy.ts"),
      "export const ts = true;\n",
    );
    assert.notEqual(runPolicyChecker(fixture).status, 0);

    await writeValidPolicyFixture(fixture);
    await writeFile(join(fixture, "tsconfig.json"), "{}\n");
    assert.notEqual(runPolicyChecker(fixture).status, 0);

    await writeValidPolicyFixture(fixture);
    await writeFile(
      join(fixture, "vite.config.js"),
      `export default {
  resolve: {
    extensions: [".js", ".ts", ".vue"],
  },
};
`,
    );
    assert.notEqual(runPolicyChecker(fixture).status, 0);

    await writeValidPolicyFixture(fixture);
    await writeFile(
      join(fixture, "vite.config.js"),
      `import legacy from "@vitejs/plugin-legacy";

export default {
  build: {
    target: "es5",
  },
  plugins: [legacy()],
};
`,
    );
    assert.notEqual(runPolicyChecker(fixture).status, 0);

    await writeValidPolicyFixture(fixture);
    await writeFile(
      join(fixture, "package.json"),
      `${JSON.stringify(
        {
          ...validPackagePolicy(),
          browserslist: ["defaults", "ie 11"],
        },
        null,
        2,
      )}\n`,
    );
    assert.notEqual(runPolicyChecker(fixture).status, 0);

    await writeValidPolicyFixture(fixture);
    await writeFile(join(fixture, ".eslintrc.cjs"), "module.exports = {};\n");
    assert.notEqual(runPolicyChecker(fixture).status, 0);

    await writeValidPolicyFixture(fixture);
    await writeFile(
      join(fixture, "src/services/gallery-service.js"),
      "export function createGalleryService() { return {}; }\n",
    );
    assert.notEqual(runPolicyChecker(fixture).status, 0);
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
  await mkdir(join(fixture, "scripts"));
  await mkdir(join(fixture, "src"));
  await mkdir(join(fixture, "tasks"));
  await mkdir(join(fixture, "tests"));
  await mkdir(join(fixture, ".github/workflows"), { recursive: true });
  await cp(
    new URL("../scripts/check-repository-policy.js", import.meta.url),
    join(fixture, "scripts/check-repository-policy.js"),
  );
  await writeFile(join(fixture, ".github/workflows/ci.yml"), validCiWorkflow());
  await writeFile(
    join(fixture, ".github/workflows/dependabot-automerge.yml"),
    validAutomergeWorkflow(),
  );
  await writeFile(
    join(fixture, ".github/dependabot.yml"),
    validDependabotConfig(),
  );
  await writeFile(
    join(fixture, ".github/branch-protection.md"),
    validBranchProtectionDeferral(),
  );
  await writeFile(join(fixture, ".gitignore"), "node_modules\n");
  await writeFile(join(fixture, ".node-version"), "24.16.0\n");
  await writeFile(
    join(fixture, ".npmrc"),
    "engine-strict=true\nsave-exact=true\nmin-release-age=7\n",
  );
  await writeFile(join(fixture, "README.md"), "# Fixture\n");
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

function runPolicyChecker(cwd) {
  return spawnSync(
    "node",
    [join(root.pathname, "scripts/check-repository-policy.js")],
    { cwd, encoding: "utf8" },
  );
}

async function writeValidPolicyFixture(fixture) {
  await mkdir(join(fixture, ".github/workflows"), { recursive: true });
  await mkdir(join(fixture, "scripts"), { recursive: true });
  await mkdir(join(fixture, "src/components/home"), { recursive: true });
  await mkdir(join(fixture, "src/services"), { recursive: true });
  await writeFile(join(fixture, ".node-version"), "24.16.0\n");
  await writeFile(
    join(fixture, ".npmrc"),
    "engine-strict=true\nsave-exact=true\nmin-release-age=7\n",
  );
  await writeFile(
    join(fixture, "package.json"),
    `${JSON.stringify(validPackagePolicy(), null, 2)}\n`,
  );
  await writeFile(
    join(fixture, "package-lock.json"),
    `${JSON.stringify({ packages: { "": validPackagePolicy() } }, null, 2)}\n`,
  );
  await writeFile(join(fixture, ".github/workflows/ci.yml"), validCiWorkflow());
  await writeFile(
    join(fixture, ".github/workflows/dependabot-automerge.yml"),
    validAutomergeWorkflow(),
  );
  await writeFile(
    join(fixture, ".github/dependabot.yml"),
    validDependabotConfig(),
  );
  await writeFile(
    join(fixture, ".github/branch-protection.md"),
    validBranchProtectionDeferral(),
  );
  await writeFile(
    join(fixture, "src/components/home/InfiniteScrollContainer.vue"),
    '<template><div data-gallery-layout="masonry"></div></template>\n',
  );
  await writeFile(
    join(fixture, "src/services/gallery-service.js"),
    `/**
 * @typedef {Object} FlickrPhoto
 * @property {string} id
 */

/**
 * @typedef {Object} GallerySnapshot
 * @property {Array<Object>} itemList
 */

/**
 * @typedef {Object} GalleryCacheEntry
 * @property {GallerySnapshot|null} value
 */

/**
 * @typedef {Object} GalleryPageResult
 * @property {{ data: FlickrPhoto[], totalPages: number }} data
 */
export function createGalleryService() {
  return {};
}
`,
  );
  await writeFile(join(fixture, "eslint.config.js"), "export default [];\n");
  await writeFile(
    join(fixture, "vite.config.js"),
    `export default {
  resolve: {
    alias: {},
  },
};
`,
  );
}

function validPackagePolicy() {
  return {
    dependencies: {
      "@mdi/font": "7.4.47",
      "roboto-fontface": "0.10.0",
      vue: "3.5.38",
      "vue-router": "5.1.0",
      vuetify: "4.1.1",
    },
    devDependencies: {
      "@eslint/js": "10.0.1",
      "@playwright/test": "1.60.0",
      "@vitejs/plugin-vue": "6.0.7",
      "@vitest/coverage-v8": "4.1.8",
      "@vue/test-utils": "2.4.11",
      eslint: "10.5.0",
      "eslint-plugin-vue": "10.9.2",
      jsdom: "29.1.1",
      prettier: "3.8.4",
      sass: "1.101.0",
      vite: "8.0.16",
      "vite-plugin-vuetify": "2.1.3",
      vitest: "4.1.8",
    },
    engines: {
      node: "24.16.0",
    },
    packageManager: "npm@11.13.0",
  };
}

function validCiWorkflow() {
  return `name: CI

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  install:
    name: ci/install
    steps:
      - run: npm install -g npm@11.13.0
      - run: npm ci
  audit-signatures:
    name: ci/audit-signatures
    steps:
      - run: npm ci
      - run: npm audit signatures --min-release-age=0
  audit-vulnerabilities:
    name: ci/audit-vulnerabilities
    steps:
      - run: npm ci
      - run: npm audit --audit-level=high
  format:
    name: ci/format
    steps:
      - run: ./run.sh format
  check:
    name: ci/check
    steps:
      - run: ./run.sh check
  build:
    name: ci/build
    steps:
      - run: ./run.sh build
      - run: cp dist/index.html dist/404.html
  test-coverage:
    name: ci/test-coverage
    steps:
      - run: ./run.sh test
  e2e-tests:
    name: ci/e2e-tests
    steps:
      - run: ./run.sh e2e-tests
  deploy:
    name: deploy
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs:
      - install
      - audit-signatures
      - audit-vulnerabilities
      - check
      - build
      - test-coverage
      - e2e-tests
    steps:
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
      - uses: actions/deploy-pages@v4
`;
}

function validBranchProtectionDeferral() {
  return `# Branch Protection

Branch protection is deferred until the user explicitly approves applying remote settings.

Required checks:
- ci/install
- ci/audit-signatures
- ci/audit-vulnerabilities
- ci/check
- ci/build
- ci/test-coverage
- ci/e2e-tests
`;
}

function validDependabotConfig() {
  return `version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    cooldown:
      default-days: 7

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    cooldown:
      default-days: 7
`;
}

function validAutomergeWorkflow() {
  return `name: Dependabot Automerge

on:
  pull_request_target:
    types:
      - opened
      - reopened
      - synchronize
  workflow_run:
    workflows:
      - CI
    types:
      - completed

jobs:
  metadata:
    if: github.event_name == 'pull_request_target' && github.actor == 'dependabot[bot]'
    runs-on: ubuntu-latest
    permissions:
      pull-requests: read
      statuses: write
    steps:
      - uses: dependabot/fetch-metadata@v3
        id: metadata
      - name: Write metadata status
        env:
          GH_TOKEN: \${{ github.token }}
          HEAD_SHA: \${{ github.event.pull_request.head.sha }}
          ECOSYSTEM: \${{ steps.metadata.outputs.package-ecosystem }}
          DIRECTORY: \${{ steps.metadata.outputs.directory }}
          UPDATE_TYPE: \${{ steps.metadata.outputs.update-type }}
        run: |
          DESCRIPTION="$(jq -cn --arg ecosystem "$ECOSYSTEM" --arg directory "$DIRECTORY" --arg updateType "$UPDATE_TYPE" '{ecosystem:$ecosystem,directory:$directory,updateType:$updateType}')"
          if [ "\${#DESCRIPTION}" -gt 140 ]; then
            echo "::error title=Dependabot metadata too long::Metadata status description is \${#DESCRIPTION} characters, which exceeds GitHub's 140 character status description limit."
            exit 1
          fi
          gh api repos/\${{ github.repository }}/statuses/"$HEAD_SHA" -f state=success -f context=dependabot/metadata -f description="$DESCRIPTION"

  automerge:
    if: github.event_name == 'workflow_run' && github.event.workflow_run.conclusion == 'success'
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      checks: read
      statuses: read
    steps:
      - name: Enable safe Dependabot auto-merge
        env:
          GH_TOKEN: \${{ github.token }}
        run: |
          fail() {
            echo "::error title=$1::$2"
            exit 1
          }

          REQUIRED_CHECKS='["ci/install","ci/audit-signatures","ci/audit-vulnerabilities","ci/format","ci/build","ci/test-coverage"]'
          PR_COUNT="$(jq '[.workflow_run.pull_requests[]? | select(.number != null)] | length' "$GITHUB_EVENT_PATH")"
          if [ "$PR_COUNT" -ne 1 ]; then
            echo "::notice title=Automerge skipped::Expected exactly one pull request on the workflow_run event, found $PR_COUNT."
            exit 0
          fi
          PR_NUMBER="$(jq -r '.workflow_run.pull_requests | map(select(.number != null)) | .[0].number' "$GITHUB_EVENT_PATH")"
          PR="$(gh api repos/\${{ github.repository }}/pulls/"$PR_NUMBER")" || fail "Pull request lookup failed" "Could not fetch pull request #$PR_NUMBER."
          PR_AUTHOR="$(jq -r '.user.login // ""' <<<"$PR")"
          PR_STATE="$(jq -r '.state // ""' <<<"$PR")"
          if [ "$PR_AUTHOR" != "dependabot[bot]" ] || [ "$PR_STATE" != "open" ]; then
            echo "::notice title=Automerge skipped::Pull request #$PR_NUMBER is authored by '$PR_AUTHOR' and is '$PR_STATE'."
            exit 0
          fi
          HEAD_SHA="$(jq -r '.head.sha // ""' <<<"$PR")"
          if [ -z "$HEAD_SHA" ]; then fail "Missing pull request head SHA" "Pull request #$PR_NUMBER did not include a head SHA."; fi
          STATUSES="$(gh api repos/\${{ github.repository }}/commits/"$HEAD_SHA"/statuses)" || fail "Commit statuses lookup failed" "Could not fetch commit statuses for $HEAD_SHA."
          CHECKS="$(gh api repos/\${{ github.repository }}/commits/"$HEAD_SHA"/check-runs)" || fail "Check runs lookup failed" "Could not fetch check runs for $HEAD_SHA."
          node --input-type=module - "$HEAD_SHA" "$STATUSES" "$CHECKS" "$REQUIRED_CHECKS" <<'NODE'
          const [headSha, statusesJson, checksJson, requiredChecksJson] = process.argv.slice(2);
          const metadata = { ecosystem: "npm", directory: "/", updateType: "security-update:semver-patch" };
          const allowedNpmSecurityPatch = metadata.ecosystem === "npm" && metadata.updateType === "security-update:semver-patch";
          const allowedNpmOrDocker = ["npm", "npm_and_yarn", "docker"].includes(metadata.ecosystem) && ["version-update:semver-patch", "version-update:semver-minor"].includes(metadata.updateType);
          const allowedActions = metadata.ecosystem === "github-actions" && metadata.updateType.startsWith("version-update:");
          if (!allowedNpmSecurityPatch && !allowedNpmOrDocker && !allowedActions) process.exit(1);
          NODE
          gh pr merge "$PR_NUMBER" --auto --match-head-commit "$HEAD_SHA" || fail "Enable auto-merge failed" "Could not enable auto-merge for pull request #$PR_NUMBER at $HEAD_SHA."
`;
}

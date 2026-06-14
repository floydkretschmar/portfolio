import { readFileSync } from "node:fs";
import { join } from "node:path";

const expectedNode = "24.16.0";
const expectedPackageManager = "npm@11.13.0";
const branchProtectionChecks = [
  "ci/install",
  "ci/audit-signatures",
  "ci/audit-vulnerabilities",
  "ci/check",
  "ci/build",
  "ci/test-coverage",
  "ci/e2e-tests",
];
const automergeRequiredChecks = [
  "ci/install",
  "ci/audit-signatures",
  "ci/audit-vulnerabilities",
  "ci/format",
  "ci/build",
  "ci/test-coverage",
];
const requiredJobIds = [
  "install",
  "audit-signatures",
  "audit-vulnerabilities",
  "check",
  "build",
  "test-coverage",
  "e2e-tests",
];
const expectedNpmPolicy = new Map([
  ["engine-strict", "true"],
  ["min-release-age", "7"],
  ["save-exact", "true"],
]);
const packageJson = readJson("package.json");

const errors = [
  ...checkPackageJson(),
  ...checkPackageLock(),
  ...checkNodeVersion(),
  ...checkNpmPolicy(),
  ...checkWorkflowPolicy(),
  ...checkDependabotPolicy(),
  ...checkAutomergePolicy(),
  ...checkBranchProtectionDeferral(),
];

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

function checkPackageJson() {
  return [
    packageJson.engines?.node === expectedNode
      ? undefined
      : `package.json engines.node must be ${expectedNode}`,
    packageJson.packageManager === expectedPackageManager
      ? undefined
      : `package.json packageManager must be ${expectedPackageManager}`,
    ...checkExactVersions("dependencies", packageJson.dependencies),
    ...checkExactVersions("devDependencies", packageJson.devDependencies),
  ].filter(Boolean);
}

function checkNodeVersion() {
  const declaredVersion = readText(".node-version").trim();
  return declaredVersion === expectedNode
    ? []
    : [`.node-version must be ${expectedNode}`];
}

function checkPackageLock() {
  const lockRoot = readJson("package-lock.json").packages?.[""];

  if (!lockRoot) {
    return ["package-lock.json must include root package metadata"];
  }

  return [
    sameJson(lockRoot.dependencies, packageJson.dependencies)
      ? undefined
      : "package-lock.json root dependencies must match package.json",
    sameJson(lockRoot.devDependencies, packageJson.devDependencies)
      ? undefined
      : "package-lock.json root devDependencies must match package.json",
    sameJson(lockRoot.engines, packageJson.engines)
      ? undefined
      : "package-lock.json root engines must match package.json",
  ].filter(Boolean);
}

function checkNpmPolicy() {
  const npmrc = new Map(
    readText(".npmrc")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => line.split("=", 2)),
  );

  return [...expectedNpmPolicy]
    .filter(([key, value]) => npmrc.get(key) !== value)
    .map(([key, value]) => `.npmrc must set ${key}=${value}`);
}

function checkWorkflowPolicy() {
  const workflow = readRequiredText(".github/workflows/ci.yml");

  if (!workflow) {
    return [".github/workflows/ci.yml must exist"];
  }

  return [
    includesAll(workflow, [
      "name: CI",
      "name: ci/install",
      "npm install -g npm@11.13.0",
      "npm ci",
      "name: ci/audit-signatures",
      "npm audit signatures --min-release-age=0",
      "name: ci/audit-vulnerabilities",
      "npm audit --audit-level=high",
      "name: ci/format",
      "./run.sh format",
      "name: ci/check",
      "./run.sh check",
      "name: ci/build",
      "./run.sh build",
      "cp dist/index.html dist/404.html",
      "name: ci/test-coverage",
      "./run.sh test",
      "name: ci/e2e-tests",
      "./run.sh e2e-tests",
      "name: deploy",
      "if: github.event_name == 'push' && github.ref == 'refs/heads/main'",
      "actions/configure-pages@v5",
      "actions/upload-pages-artifact@v3",
      "actions/deploy-pages@v4",
    ])
      ? undefined
      : ".github/workflows/ci.yml must define required run.sh validation, audit, and deploy gates",
    includesAll(
      workflow,
      requiredJobIds.map((job) => `- ${job}`),
    )
      ? undefined
      : ".github/workflows/ci.yml deploy gate must depend on every required validation check",
    /deploy:[\s\S]*needs:[\s\S]*- format/.test(workflow)
      ? ".github/workflows/ci.yml deploy gate must not require the mutating format check"
      : undefined,
    /audit-signatures:[\s\S]*npm ci[\s\S]*npm audit signatures --min-release-age=0/.test(
      workflow,
    )
      ? undefined
      : ".github/workflows/ci.yml audit-signatures gate must install dependencies before auditing signatures",
    /audit-vulnerabilities:[\s\S]*npm ci[\s\S]*npm audit --audit-level=high/.test(
      workflow,
    )
      ? undefined
      : ".github/workflows/ci.yml audit-vulnerabilities gate must install dependencies before vulnerability audit",
    /run:\s*\|/.test(workflow)
      ? ".github/workflows/ci.yml must not use inline complex validation shell"
      : undefined,
    /(secrets\.|GH_TOKEN|GITHUB_TOKEN:|PERSONAL_ACCESS_TOKEN|PAT)/.test(
      workflow,
    )
      ? ".github/workflows/ci.yml must not introduce secret material or credential configuration"
      : undefined,
  ].filter(Boolean);
}

function checkDependabotPolicy() {
  const dependabot = readRequiredText(".github/dependabot.yml");

  if (!dependabot) {
    return [".github/dependabot.yml must exist"];
  }

  return [
    includesAll(dependabot, [
      'package-ecosystem: "npm"',
      'package-ecosystem: "github-actions"',
      'interval: "weekly"',
      "cooldown:",
      "default-days: 7",
    ])
      ? undefined
      : ".github/dependabot.yml must configure weekly npm and GitHub Actions updates with a seven-day cooldown",
    /package-ecosystem:\s*docker/.test(dependabot)
      ? ".github/dependabot.yml must not configure Docker updates"
      : undefined,
  ].filter(Boolean);
}

function checkAutomergePolicy() {
  const workflow = readRequiredText(
    ".github/workflows/dependabot-automerge.yml",
  );
  const script = readRequiredText("scripts/dependabot-automerge.sh");

  if (!workflow) {
    return [".github/workflows/dependabot-automerge.yml must exist"];
  }

  return [
    includesAll(workflow, [
      "name: Dependabot Automerge",
      "pull_request_target:",
      "workflow_run:",
      "workflows:",
      "- CI",
      "jobs:",
      "metadata:",
      "if: github.event_name == 'pull_request_target' && github.actor == 'dependabot[bot]'",
      "pull-requests: read",
      "statuses: write",
      "dependabot/fetch-metadata@v3",
      "context=dependabot/metadata",
      "automerge:",
      "if: github.event_name == 'workflow_run' && github.event.workflow_run.conclusion == 'success'",
      "checks: read",
      "statuses: read",
      `REQUIRED_CHECKS='${JSON.stringify(automergeRequiredChecks)}'`,
      "Commit statuses",
      "Check runs",
      "dependabot/metadata",
      'metadata.ecosystem === "npm" && metadata.updateType === "security-update:semver-patch"',
      "security-update:semver-patch",
      "gh pr merge",
      "--match-head-commit",
    ])
      ? undefined
      : ".github/workflows/dependabot-automerge.yml must match the reference metadata/status workflow_run automerge structure with security patch support",
    script
      ? "scripts/dependabot-automerge.sh must not exist; automerge logic belongs inline in the reference workflow structure"
      : undefined,
    /semver-major/.test(workflow)
      ? ".github/workflows/dependabot-automerge.yml must not automerge npm major updates"
      : undefined,
    /\["npm", "npm_and_yarn", "docker"\][\s\S]*security-update:semver-patch/.test(
      workflow,
    )
      ? ".github/workflows/dependabot-automerge.yml must scope security patch automerge to npm only"
      : undefined,
    /uses:\s*actions\/checkout@/.test(workflow)
      ? ".github/workflows/dependabot-automerge.yml must not checkout repository code"
      : undefined,
    /(secrets\.|PERSONAL_ACCESS_TOKEN|PAT_TOKEN)/.test(workflow)
      ? ".github/workflows/dependabot-automerge.yml must not introduce secret material or credential configuration"
      : undefined,
  ].filter(Boolean);
}

function checkBranchProtectionDeferral() {
  const deferral = readRequiredText(".github/branch-protection.md");

  if (!deferral) {
    return [".github/branch-protection.md must exist"];
  }

  return [
    includesAll(deferral, [
      "Branch protection is deferred",
      ...branchProtectionChecks,
    ])
      ? undefined
      : ".github/branch-protection.md must document user-approved branch-protection deferral and required checks",
    /- ci\/format/.test(deferral)
      ? ".github/branch-protection.md must not require the mutating format check"
      : undefined,
  ].filter(Boolean);
}

function checkExactVersions(label, dependencies = {}) {
  return Object.entries(dependencies)
    .filter(([, version]) => !/^\d+\.\d+\.\d+(-[\w.-]+)?$/.test(version))
    .map(([name]) => `package.json ${label}.${name} must use an exact version`);
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function readText(path) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function readRequiredText(path) {
  try {
    return readText(path);
  } catch (error) {
    if (error.code === "ENOENT") {
      return "";
    }

    throw error;
  }
}

function sameJson(left, right) {
  return JSON.stringify(left ?? {}) === JSON.stringify(right ?? {});
}

function includesAll(text, values) {
  return values.every((value) => text.includes(value));
}

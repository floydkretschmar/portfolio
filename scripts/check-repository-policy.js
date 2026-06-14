import { readFileSync } from "node:fs";
import { join } from "node:path";

const expectedNode = "24.16.0";
const expectedPackageManager = "npm@11.13.0";
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

function sameJson(left, right) {
  return JSON.stringify(left ?? {}) === JSON.stringify(right ?? {});
}

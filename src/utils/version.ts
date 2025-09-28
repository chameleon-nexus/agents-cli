import * as semver from 'semver';

export function compareVersions(version1: string, version2: string): number {
  return semver.compare(version1, version2);
}

export function isValidVersion(version: string): boolean {
  return semver.valid(version) !== null;
}

export function getLatestVersion(versions: string[]): string {
  const validVersions = versions.filter(isValidVersion);
  if (validVersions.length === 0) {
    return versions[0] || '1.0.0';
  }
  
  return semver.maxSatisfying(validVersions, '*') || validVersions[0];
}

export function satisfiesVersion(version: string, range: string): boolean {
  return semver.satisfies(version, range);
}

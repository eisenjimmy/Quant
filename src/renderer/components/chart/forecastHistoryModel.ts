import type { ForecastSavedSummary } from '../../../shared/forecast';

export function orderUnexpiredForecasts(
  records: readonly ForecastSavedSummary[],
  nowMs = Date.now(),
): ForecastSavedSummary[] {
  return records
    .filter((record) => {
      const generatedAt = Date.parse(record.generatedAt);
      const expiresAt = Date.parse(record.expiresAt);
      return (
        Number.isFinite(generatedAt) &&
        Number.isFinite(expiresAt) &&
        expiresAt > nowMs
      );
    })
    .slice()
    .sort((left, right) => {
      const generatedDifference =
        Date.parse(right.generatedAt) - Date.parse(left.generatedAt);
      return generatedDifference !== 0
        ? generatedDifference
        : right.id.localeCompare(left.id);
    });
}

export function chooseSavedForecastId(
  records: readonly ForecastSavedSummary[],
  preferredId: string | undefined,
  nowMs = Date.now(),
): string {
  const ordered = orderUnexpiredForecasts(records, nowMs);
  if (
    preferredId &&
    ordered.some((record) => record.id === preferredId)
  ) {
    return preferredId;
  }
  return ordered[0]?.id ?? '';
}

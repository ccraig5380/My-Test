/**
 * Staff-first scheduling now. Flip AUTO_DISPATCH=true later for ~10 drivers.
 *
 * When automation is on, cron can call autoSuggestDriver():
 * zip -> zone -> active driver in that zone with remaining max_jobs_per_day.
 * Route optimization (stop order) is a later step on top of this assignment.
 */
export const autoDispatchEnabled = process.env.AUTO_DISPATCH === "true";

export function zoneForZip(_zip: string) {
  return "houston";
}

export type DriverLoad = {
  id: string;
  name: string;
  zone: string;
  max_jobs_per_day: number;
  jobsToday: number;
};

export function autoSuggestDriver(
  zone: string,
  drivers: DriverLoad[],
): DriverLoad | null {
  const open = drivers
    .filter((driver) => driver.zone === zone)
    .filter((driver) => driver.jobsToday < driver.max_jobs_per_day)
    .sort((a, b) => a.jobsToday - b.jobsToday);
  return open[0] ?? null;
}

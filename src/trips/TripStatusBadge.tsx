import type { JSX } from "react";
import type { Trip } from "../types";

/** Draft/Published pill for a trip. Shared by TripsListPage and TripBuilderPage. */
export function TripStatusBadge({ status }: { status: Trip["status"] }): JSX.Element {
  return (
    <span className={`trip-status-badge ${status}`}>
      {status === "published" ? "Published" : "Draft"}
    </span>
  );
}

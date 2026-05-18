export const fetchDepaturesForStop = async (stopId: string) => {
  const response = await fetch(
    `${process.env.CKAN_DEPARTURES_URL}?stopId=${stopId}`,
  );

  if (!stopId) {
    throw new Error("Stop ID is required to fetch departures");
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch departures for stop ${stopId}`);
  }
  return response.json();
};

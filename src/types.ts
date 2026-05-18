export interface DepartureData {
  id: string;
  delayInSeconds: number;
  estimatedTime: string;
  headsign: string;
  routeId: number;
  routeShortName: string;
  scheduledTripStartTime: string;
  tripId: number;
  status: string;
  theoreticalTime: string;
  timestamp: string;
  trip: number;
  vehicleCode: number;
  vehicleId: number;
  vehicleService: string;
}

export interface DeparturesResponse {
  lastUpdate: string;
  departures: DepartureData[];
}

export interface StopInfo {
  stopId: number;
  stopCode: string;
  name: string;
}

export interface StopData extends StopInfo {
  departures: DepartureData[];
  lastUpdate: string | null;
  error?: string;
}

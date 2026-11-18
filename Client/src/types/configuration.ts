export interface SystemConfiguration {
  defaultDailyTouchpointTarget: number;
  maxDailyTouchpointTarget: number;
  updatedAt?: string;
  updatedBy?: string;
  updatedByName?: string;
}

export interface UpdateSystemConfigurationRequest {
  defaultDailyTouchpointTarget: number;
  maxDailyTouchpointTarget: number;
}

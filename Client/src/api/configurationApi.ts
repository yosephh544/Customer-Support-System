import { api } from './client';
import type { SystemConfiguration, UpdateSystemConfigurationRequest } from '../types';

export const configurationApi = {
  getConfiguration: () =>
    api.get<SystemConfiguration>('/configuration'),

  updateConfiguration: (data: UpdateSystemConfigurationRequest) =>
    api.put<SystemConfiguration>('/configuration', data),
};

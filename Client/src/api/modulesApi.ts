import type { MasterModule, PagedResult, PaginationParams } from '../types';

export interface CreateMasterModuleInput {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateMasterModuleInput {
  name: string;
  description?: string;
  isActive: boolean;
}

export const modulesApi = {
  getMasterModules: async (_params?: PaginationParams & { isActive?: boolean }): Promise<PagedResult<MasterModule>> => ({
    items: [],
    totalCount: 0,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  }),
};


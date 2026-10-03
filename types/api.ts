import type { ApplicationListItem, ApplicationPagination } from "./application";

export interface ApplicationsResponse {
  success: boolean;
  applications: ApplicationListItem[];
  pagination: ApplicationPagination;
}

export interface CreateApplicationResponse {
  success: boolean;
  application: ApplicationListItem;
}

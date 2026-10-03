export interface ApplicationListItem {
  _id: string;
  organizationId: string;
  name: string;
  vendor: string;
  category: string;
  description?: string;
  website?: string;
  status: "active" | "inactive" | "archived";
  owner?: string;
  usersCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

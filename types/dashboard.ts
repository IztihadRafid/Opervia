export interface DashboardMetric {
  title: string;
  value: string;
  description: string;
}

export interface UpcomingRenewal {
  id: string;
  name: string;
  category: string;
  amount: string;
  date: string;
}

export interface RecentActivity {
  id: string;
  title: string;
  description: string;
  time: string;
}
"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface CategoryDonutChartProps {
  data: {
    name: string;
    count: number;
  }[];
  total: number;
}

const CATEGORY_COLORS = [
  "#6366f1",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#f97316",
  "#14b8a6",
];

export function CategoryDonutChart({ data, total }: CategoryDonutChartProps) {
  const categories = data.filter((item) => item.count > 0);
  const chartTotal = categories.reduce((sum, item) => sum + item.count, 0);

  const options: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "var(--font-jakarta), sans-serif",
      toolbar: { show: false },
      animations: { enabled: true },
    },
    labels: categories.map((item) => item.name),
    colors: CATEGORY_COLORS,
    stroke: {
      width: 3,
      colors: ["var(--card)"],
    },
    legend: {
      show: false,
    },
    plotOptions: {
      pie: {
        expandOnClick: false,
        donut: {
          size: "72%",
          labels: {
            show: true,
            name: {
              show: true,
              offsetY: -8,
              color: "#94a3b8",
              fontSize: "12px",
            },
            value: {
              show: true,
              offsetY: 8,
              color: "var(--foreground)",
              fontSize: "24px",
              fontWeight: 600,
              formatter: (value) => String(value),
            },
            total: {
              show: true,
              showAlways: true,
              label: "Applications",
              color: "#94a3b8",
              fontSize: "12px",
              formatter: () => String(total),
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      theme: "dark",
      y: {
        formatter: (value) => `${value} application${value === 1 ? "" : "s"}`,
      },
    },
    states: {
      hover: {
        filter: { type: "lighten", value: 0.05 },
      },
      active: {
        filter: { type: "none" },
      },
    },
    responsive: [
      {
        breakpoint: 640,
        options: {
          chart: {
            width: "100%",
          },
        },
      },
    ],
  };

  if (categories.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No category data available.
      </div>
    );
  }

  return (
    <div className="grid items-center gap-5 sm:grid-cols-2">
      <div
        className="mx-auto w-full max-w-[280px]"
        role="img"
        aria-label={`Applications by category. ${categories
          .map((item) => `${item.name}: ${item.count}`)
          .join(", ")}`}
      >
        <Chart
          type="donut"
          options={options}
          series={categories.map((item) => item.count)}
          height={280}
          width="100%"
        />
      </div>

      <div className="space-y-4">
        {categories.map((item, index) => {
          const percentage =
            chartTotal > 0 ? Math.round((item.count / chartTotal) * 100) : 0;

          return (
            <div
              key={item.name}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{
                    backgroundColor:
                      CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                  }}
                  aria-hidden="true"
                />
                <span className="truncate text-sm">{item.name}</span>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-medium tabular-nums">
                  {item.count}
                </span>
                <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                  {percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

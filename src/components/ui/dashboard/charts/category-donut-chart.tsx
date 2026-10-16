"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { BrushCleaning } from "lucide-react";

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
  "#852E4E",
  "#DC586D",
  "#FB9590",
  "#A33757",
  "#FFBB94",
  "#4C1D3D",
  "#C96D7D",
  "#E7A18C",
];

export function CategoryDonutChart({ data, total }: CategoryDonutChartProps) {
  const categories = data.filter((item) => item.count > 0);
  const chartTotal = categories.reduce((sum, item) => sum + item.count, 0);

  const options: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "var(--font-jakarta), sans-serif",
      toolbar: { show: false },
      animations: { enabled: true, speed: 450 },
      background: "transparent",
    },
    labels: categories.map((item) => item.name),
    colors: CATEGORY_COLORS,
    stroke: {
      width: 4,
      colors: ["#FFFFFF"],
    },
    legend: {
      show: false,
    },
    plotOptions: {
      pie: {
        expandOnClick: false,
        donut: {
          size: "73%",
          labels: {
            show: true,
            name: {
              show: true,
              offsetY: -8,
              color: "#775E6A",
              fontSize: "12px",
              fontWeight: 500,
            },
            value: {
              show: true,
              offsetY: 8,
              color: "#4C1D3D",
              fontSize: "24px",
              fontWeight: 600,
              formatter: (value) => Number(value).toLocaleString(),
            },
            total: {
              show: true,
              showAlways: true,
              label: "Applications",
              color: "#775E6A",
              fontSize: "12px",
              fontWeight: 500,
              formatter: () => total.toLocaleString(),
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      theme: "light",
      style: {
        fontSize: "12px",
        fontFamily: "var(--font-jakarta), sans-serif",
      },
      y: {
        formatter: (value) =>
          `${value.toLocaleString()} application${value === 1 ? "" : "s"}`,
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
          plotOptions: {
            pie: {
              donut: {
                size: "70%",
              },
            },
          },
        },
      },
    ],
  };

  if (categories.length === 0) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/10 px-5 text-center">
        <div
          aria-hidden="true"
          className="mb-3 flex size-10 items-center justify-center rounded-full bg-[#852E4E]/[0.08] text-[#852E4E]"
        >
          <BrushCleaning />
        </div>
        <p className="text-sm font-medium text-foreground">
          No category data yet
        </p>
        <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
          Category distribution will appear when applications have categories.
        </p>
      </div>
    );
  }

  return (
    <div className="grid min-w-0 items-center gap-5 sm:grid-cols-2">
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

      <div className="min-w-0 space-y-4">
        {categories.map((item, index) => {
          const percentage =
            chartTotal > 0 ? Math.round((item.count / chartTotal) * 100) : 0;
          const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];

          return (
            <div
              key={item.name}
              className="flex min-w-0 items-center justify-between gap-3"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="size-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
                <span className="truncate text-sm text-foreground">
                  {item.name}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {item.count.toLocaleString()}
                </span>
                <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
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

"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface SpendingPoint {
  label: string;
  amount: number;
}

interface SpendingChartProps {
  data: SpendingPoint[];
  isLoading?: boolean;
}

export function SpendingChart({ data, isLoading = false }: SpendingChartProps) {
  const mutedText = "#775E6A";
  const gridColor = "#EAD8D9";

  const options: ApexOptions = {
    chart: {
      type: "area",
      height: 350,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      fontFamily: "var(--font-jakarta), sans-serif",
      background: "transparent",
      foreColor: mutedText,
      animations: {
        enabled: true,
        speed: 500,
      },
    },

    colors: ["#DC586D"],

    stroke: {
      curve: "smooth",
      width: 3,
      lineCap: "round",
    },

    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 0.5,
        opacityFrom: 0.3,
        opacityTo: 0.015,
        stops: [0, 85, 100],
        colorStops: [
          { offset: 0, color: "#DC586D", opacity: 0.3 },
          { offset: 100, color: "#FB9590", opacity: 0.015 },
        ],
      },
    },

    dataLabels: {
      enabled: false,
    },

    grid: {
      borderColor: gridColor,
      strokeDashArray: 4,
      padding: {
        left: 8,
        right: 12,
      },
    },

    xaxis: {
      categories: data.map((point) => point.label),
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: mutedText,
          fontSize: "12px",
          fontFamily: "var(--font-jakarta), sans-serif",
        },
        trim: true,
      },
      tooltip: {
        enabled: false,
      },
    },

    yaxis: {
      labels: {
        style: {
          colors: mutedText,
          fontSize: "12px",
          fontFamily: "var(--font-jakarta), sans-serif",
        },
        formatter: (value) => {
          if (Math.abs(value) >= 1000) {
            return `$${(value / 1000).toLocaleString(undefined, {
              maximumFractionDigits: 1,
            })}k`;
          }

          return `$${Math.round(value).toLocaleString()}`;
        },
      },
    },

    tooltip: {
      theme: "light",
      style: {
        fontSize: "12px",
        fontFamily: "var(--font-jakarta), sans-serif",
      },
      x: {
        show: true,
      },
      marker: {
        show: true,
      },
      y: {
        formatter: (value) =>
          `$${value.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}`,
      },
    },

    markers: {
      size: 0,
      colors: ["#DC586D"],
      strokeColors: "#FFFFFF",
      strokeWidth: 2,
      hover: {
        size: 5,
        sizeOffset: 2,
      },
    },

    noData: {
      text: "No spending data available.",
      align: "center",
      verticalAlign: "middle",
      style: {
        color: mutedText,
        fontSize: "14px",
        fontFamily: "var(--font-jakarta), sans-serif",
      },
    },

    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 280,
          },
          grid: {
            padding: {
              left: 0,
              right: 4,
            },
          },
          xaxis: {
            labels: {
              rotate: -35,
              rotateAlways: false,
              hideOverlappingLabels: true,
            },
          },
        },
      },
    ],
  };

  if (isLoading) {
    return (
      <div
        aria-label="Loading spending chart"
        className="h-[280px] w-full animate-pulse rounded-xl bg-muted/40 sm:h-[350px]"
      />
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[280px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-muted/10 px-4 text-center sm:h-[350px]">
        <span className="text-sm font-medium text-foreground">
          No spending data yet
        </span>
        <span className="text-xs text-muted-foreground">
          Spending trends will appear here when data is available.
        </span>
      </div>
    );
  }

  const series = [
    {
      name: "SaaS Spending",
      data: data.map((point) => point.amount),
    },
  ];

  return (
    <div
      className="w-full min-w-0"
      role="img"
      aria-label="SaaS spending trend over the selected date range"
    >
      <Chart
        options={options}
        series={series}
        type="area"
        height={350}
        width="100%"
      />
    </div>
  );
}

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
    },

    colors: ["#4f46e5"],

    stroke: {
      curve: "smooth",
      width: 3,
    },

    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.02,
        stops: [0, 90, 100],
      },
    },

    dataLabels: {
      enabled: false,
    },

    grid: {
      borderColor: "rgba(148, 163, 184, 0.15)",
      strokeDashArray: 4,
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
          colors: "#94a3b8",
          fontSize: "12px",
        },
      },
    },

    yaxis: {
      labels: {
        style: {
          colors: "#94a3b8",
          fontSize: "12px",
        },

        formatter: (value) => `$${Math.round(value / 1000)}k`,
      },
    },

    tooltip: {
      theme: "light",

      y: {
        formatter: (value) => `$${value.toLocaleString()}`,
      },
    },

    markers: {
      size: 0,

      hover: {
        size: 6,
      },
    },

    responsive: [
      {
        breakpoint: 768,

        options: {
          chart: {
            height: 280,
          },
        },
      },
    ],
  };

  if (isLoading) {
    return (
      <div className="h-[350px] w-full animate-pulse rounded-lg bg-muted/40" />
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
        No spending data available.
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
      className="w-full"
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

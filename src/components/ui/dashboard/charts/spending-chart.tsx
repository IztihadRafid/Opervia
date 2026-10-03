"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const monthlySpending = [
  18400, 22100, 19800, 24700, 23100, 28600, 26400, 31200, 29800, 33700, 32100,
  36800,
];

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

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
    categories: months,
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

const series = [
  {
    name: "SaaS Spending",
    data: monthlySpending,
  },
];

export function SpendingChart() {
  return (
    <div className="w-full">
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

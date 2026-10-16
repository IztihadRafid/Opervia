"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { Tags } from "lucide-react";

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface ExpenseCategoryItem {
  category: string;
  count: number;
  amountsByCurrency: {
    currency: string;
    amount: number;
  }[];
}

interface ExpenseCategoryDonutChartProps {
  data: ExpenseCategoryItem[];
  total: number;
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  software: { label: "Software", color: "#852E4E" },
  hardware: { label: "Hardware", color: "#DC586D" },
  cloud_hosting: { label: "Cloud Hosting", color: "#FB9590" },
  marketing: { label: "Marketing", color: "#A33757" },
  office: { label: "Office", color: "#FFBB94" },
  travel: { label: "Travel", color: "#4C1D3D" },
  professional_services: {
    label: "Professional Services",
    color: "#C96D7D",
  },
  other: { label: "Other", color: "#E7A18C" },
};

const FALLBACK_COLORS = [
  "#852E4E",
  "#DC586D",
  "#FB9590",
  "#A33757",
  "#FFBB94",
  "#4C1D3D",
  "#C96D7D",
  "#E7A18C",
];

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function formatCategory(category: string): string {
  const configured = CATEGORY_CONFIG[category];

  if (configured) {
    return configured.label;
  }

  return category
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function ExpenseCategoryDonutChart({
  data,
  total,
}: ExpenseCategoryDonutChartProps) {
  const categories = data
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((item, index) => ({
      ...item,
      name: formatCategory(item.category),
      color:
        CATEGORY_CONFIG[item.category]?.color ??
        FALLBACK_COLORS[index % FALLBACK_COLORS.length],
    }));

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
    colors: categories.map((item) => item.color),
    stroke: {
      width: 4,
      colors: ["#FFFFFF"],
    },
    legend: { show: false },
    dataLabels: { enabled: false },
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
              label: "Expenses",
              color: "#775E6A",
              fontSize: "12px",
              fontWeight: 500,
              formatter: () => total.toLocaleString(),
            },
          },
        },
      },
    },
    tooltip: {
      theme: "light",
      style: {
        fontSize: "12px",
        fontFamily: "var(--font-jakarta), sans-serif",
      },
      y: {
        formatter: (value) =>
          `${value.toLocaleString()} expense${value === 1 ? "" : "s"}`,
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
          chart: { width: "100%" },
          plotOptions: {
            pie: {
              donut: { size: "70%" },
            },
          },
        },
      },
    ],
  };

  if (total === 0 || chartTotal === 0) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/10 px-5 text-center">
        <div
          aria-hidden="true"
          className="mb-3 flex size-10 items-center justify-center rounded-full bg-[#852E4E]/[0.08] text-[#852E4E]"
        >
          <Tags aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-foreground">
          No expense data yet
        </p>
        <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
          Expense category distribution will appear when your organization has
          recorded expenses.
        </p>
      </div>
    );
  }

  return (
    <div className="grid min-w-0 items-center gap-5 sm:grid-cols-2">
      <div
        className="mx-auto w-full max-w-[280px]"
        role="img"
        aria-label={`Expenses by category. ${categories
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
        {categories.map((item) => {
          const percentage =
            chartTotal > 0 ? Math.round((item.count / chartTotal) * 100) : 0;

          return (
            <div key={item.category} className="min-w-0 space-y-2">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="size-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: item.color }}
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

              {item.amountsByCurrency.length > 0 && (
                <div className="ml-5 space-y-1">
                  {item.amountsByCurrency.map((amount) => (
                    <p
                      key={amount.currency}
                      className="text-xs tabular-nums text-muted-foreground"
                    >
                      {formatAmount(amount.amount, amount.currency)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

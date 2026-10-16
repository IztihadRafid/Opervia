"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { ReceiptText } from "lucide-react";

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type ExpenseStatus = "paid" | "pending" | "overdue" | "cancelled";

interface ExpenseStatusItem {
  status: ExpenseStatus;
  count: number;
  amountsByCurrency: {
    currency: string;
    amount: number;
  }[];
}

interface ExpenseStatusDonutChartProps {
  data: ExpenseStatusItem[];
  total: number;
}

const STATUS_CONFIG: {
  status: ExpenseStatus;
  label: string;
  color: string;
}[] = [
  { status: "paid", label: "Paid", color: "#852E4E" },
  { status: "pending", label: "Pending", color: "#DC586D" },
  { status: "overdue", label: "Overdue", color: "#FB9590" },
  { status: "cancelled", label: "Cancelled", color: "#FFBB94" },
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

export function ExpenseStatusDonutChart({
  data,
  total,
}: ExpenseStatusDonutChartProps) {
  const statusData = STATUS_CONFIG.map((config) => {
    const item = data.find((entry) => entry.status === config.status);

    return {
      ...config,
      count: item?.count ?? 0,
      amountsByCurrency: item?.amountsByCurrency ?? [],
    };
  });

  const chartData = statusData.filter((item) => item.count > 0);
  const chartTotal = chartData.reduce((sum, item) => sum + item.count, 0);

  const options: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "var(--font-jakarta), sans-serif",
      toolbar: { show: false },
      animations: { enabled: true, speed: 450 },
      background: "transparent",
    },
    labels: chartData.map((item) => item.label),
    colors: chartData.map((item) => item.color),
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
          <ReceiptText aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-foreground">
          No expense data yet
        </p>
        <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
          Expense status distribution will appear when your organization has
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
        aria-label={`Expenses by status. ${chartData
          .map((item) => `${item.label}: ${item.count}`)
          .join(", ")}`}
      >
        <Chart
          type="donut"
          options={options}
          series={chartData.map((item) => item.count)}
          height={280}
          width="100%"
        />
      </div>

      <div className="min-w-0 space-y-5">
        {statusData.map((item) => {
          const percentage =
            chartTotal > 0 ? Math.round((item.count / chartTotal) * 100) : 0;

          return (
            <div key={item.status} className="min-w-0 space-y-2">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="size-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                  <span className="truncate text-sm text-foreground">
                    {item.label}
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

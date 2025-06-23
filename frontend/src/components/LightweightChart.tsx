"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import {
  createChart,
  IChartApi,
  DeepPartial,
  ChartOptions,
  ColorType,
  Time,
  LineSeries,
} from "lightweight-charts";

interface PriceData {
  time: number; // UNIX timestamp in milliseconds
  price: number;
}

interface Props {
  data: PriceData[];
  height?: number;
  symbol?: string;
}

const LightweightChart: React.FC<Props> = ({
  data,
  height = 200,
  symbol = "Asset",
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [isClient, setIsClient] = useState(false);

  useLayoutEffect(() => {
    setIsClient(true);
  }, []);

  useLayoutEffect(() => {
    if (!isClient || !chartContainerRef.current || !data || data.length === 0)
      return;

    let chart: IChartApi | null = null;

    try {
      // Clean up any previous chart
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }

      // Chart options
      const chartOptions: DeepPartial<ChartOptions> = {
        layout: {
          background: { type: ColorType.Solid, color: "white" },
          textColor: "black",
        },
        width: chartContainerRef.current.clientWidth,
        height,
        grid: {
          vertLines: { visible: false },
          horzLines: { color: "#f0f0f0" },
        },
        rightPriceScale: {
          borderVisible: false,
        },
        timeScale: {
          borderVisible: false,
          timeVisible: true,
          secondsVisible: false,
          rightOffset: 0,
          barSpacing: 6,
          rightBarStaysOnScroll: true,
          lockVisibleTimeRangeOnResize: true,
        },
        handleScroll: false,
        handleScale: false,
      };

      // Create chart
      chart = createChart(chartContainerRef.current, chartOptions);
      chartRef.current = chart;

      // Add line series
      const lineSeries = chart.addSeries(LineSeries, {
        color: "#2962FF",
        lineWidth: 2,
        priceFormat: {
          type: "price",
          precision: 6,
          minMove: 0.000001,
        },
        lastValueVisible: true,
      });

      // Transform data
      let chartData = data
        .map((item) => ({
          time: Math.floor((item.time - 4 * 60 * 60 * 1000) / 1000) as Time, // Subtract 4 hours and convert to seconds
          value: item.price,
        }))
        .sort((a, b) => {
          const timeA =
            typeof a.time === "number"
              ? a.time
              : new Date(a.time.toString()).getTime();
          const timeB =
            typeof b.time === "number"
              ? b.time
              : new Date(b.time.toString()).getTime();
          return timeA - timeB;
        });

      // Use fallback data if none provided
      if (chartData.length === 0) {
        chartData = [
          { time: 1680000000 as Time, value: 100 },
          { time: 1680003600 as Time, value: 105 },
        ];
      }

      // Set the data
      lineSeries.setData(chartData);

      // Fit all data points into the visible area
      setTimeout(() => {
        chartRef.current?.timeScale().fitContent();
      }, 50);

      // Add custom tooltip
      if (chartContainerRef.current) {
        const container = chartContainerRef.current;
        const toolTip = document.createElement("div");

        // Style the tooltip
        toolTip.style.position = "absolute";
        toolTip.style.display = "none";
        toolTip.style.padding = "8px";
        toolTip.style.boxSizing = "border-box";
        toolTip.style.fontSize = "12px";
        toolTip.style.color = "black";
        toolTip.style.background = "white";
        toolTip.style.borderRadius = "4px";
        toolTip.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)";
        toolTip.style.pointerEvents = "none";
        toolTip.style.zIndex = "1000";
        toolTip.style.border = "1px solid #ddd";

        container.appendChild(toolTip);

        // Update tooltip
        chartRef.current?.subscribeCrosshairMove((param) => {
          if (
            !param.point ||
            !param.time ||
            param.point.x < 0 ||
            param.point.y < 0
          ) {
            toolTip.style.display = "none";
            return;
          }

          // Get price value at current crosshair position
          const seriesData = param.seriesData.get(lineSeries);

          if (!seriesData) {
            toolTip.style.display = "none";
            return;
          }

          // Handle different data formats - for LineSeries we expect a number directly
          let price: number;
          if (typeof seriesData === "number") {
            price = seriesData;
          } else if (
            seriesData &&
            typeof seriesData === "object" &&
            "value" in seriesData
          ) {
            price = (seriesData as { value: number }).value;
          } else {
            toolTip.style.display = "none";
            return;
          }

          if (isNaN(price)) {
            toolTip.style.display = "none";
            return;
          }

          toolTip.style.display = "block";

          const dateStr =
            typeof param.time === "number"
              ? new Date(param.time * 1000).toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              : new Date(param.time.toString()).toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                });

          toolTip.innerHTML = `
            <div style="font-weight:500">${dateStr}</div>
            <div style="font-size:16px">$${Number(price).toFixed(6)}</div>
          `;

          let shiftedCoordinate = param.point.x - 50;
          const containerWidth = container.clientWidth;
          shiftedCoordinate = Math.max(
            0,
            Math.min(containerWidth - 100, shiftedCoordinate)
          );
          const coordinateY = param.point.y;

          toolTip.style.left = shiftedCoordinate + "px";
          toolTip.style.top = coordinateY - 100 + "px";
        });
      }

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener("resize", handleResize);

      // Cleanup
      return () => {
        window.removeEventListener("resize", handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
      };
    } catch (error) {
      console.error("Error initializing chart:", error);
      // Clean up on error
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    }
  }, [data, height, isClient]);

  // Function to export data as CSV
  const exportDataAsCSV = () => {
    if (!data || data.length === 0) return;

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Price\n";

    // Sort data by time
    const sortedData = [...data].sort((a, b) => a.time - b.time);

    // Add each data point to CSV
    sortedData.forEach((item) => {
      const date = new Date(item.time).toISOString();
      csvContent += `${date},${item.price}\n`;
    });

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${symbol}_price_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Server-side and initial client render
  if (!isClient || !data || data.length === 0) {
    return (
      <div className="w-full p-4 bg-white rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">{symbol} Price Chart</h3>
        <div
          className={`h-[${height}px] flex items-center justify-center text-gray-500`}
        >
          {!isClient ? "Loading..." : "No price data available"}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
        <h3 className="text-lg font-semibold mb-2 md:mb-0">
          {symbol} Price Chart
        </h3>
      </div>

      <div className="flex justify-between mb-4">
        <div className="flex space-x-2">
          <button
            onClick={exportDataAsCSV}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md flex items-center"
            title="Download data as CSV"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            CSV
          </button>
        </div>
      </div>

      <div className="relative">
        <div ref={chartContainerRef} className="w-full" />
      </div>
    </div>
  );
};

export default LightweightChart;

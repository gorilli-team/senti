// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export const API_ENDPOINTS = {
  data: `${API_BASE_URL}/api/data`,
  priceFeeds: `${API_BASE_URL}/api/price-feeds`,
  rsiSignals: `${API_BASE_URL}/api/rsi-signals`,
  fearGreed: `${API_BASE_URL}/api/fear-greed`,
  tradingHistory: `${API_BASE_URL}/api/trading-history`,
  health: `${API_BASE_URL}/health`,
};

export const fetchAPI = async (endpoint: string, options?: RequestInit) => {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};

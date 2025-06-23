export function getSymbolFromId(id) {
  const map = {
    "0": "BTC/USDT",
    "1": "ETH/USDT",
    "10": "SOL/USDT",
  };
  return map[id] || `UNKNOWN(${id})`;
}
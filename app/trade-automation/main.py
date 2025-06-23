from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import find_dotenv, load_dotenv
import time

dotenv_path = find_dotenv()
load_dotenv(dotenv_path)

client = MongoClient(os.getenv("MONGODB_CONNECTION_STRING"))
db = client["oracle"]
signals = db["rsi_signals"]
trades = db["executed_trades"]

TRADE_AMOUNT = 100

def normalize_price(price):
    return float(price) / 1e18

def simulate_trade(signal, action: str):
    pair = signal["pair"]
    timestamp = signal["timestamp"]
    raw_price = signal["price"]
    price = normalize_price(raw_price)

    print(f"{timestamp}: {action} {TRADE_AMOUNT}$ on {pair} at {price}")

    trade_doc = {
        "pair": pair,
        "action": action,
        "amount_usd": TRADE_AMOUNT,
        "price": price,
        "timestamp": timestamp,
        "rsi": signal["rsi"]
    }

    trades.insert_one(trade_doc)

def check_and_trade():
    pairs = ["BTC/USDT", "ETH/USDT", "SOL/USDT"]
    for pair in pairs:
        last_signal = signals.find({"pair": pair}).sort("timestamp", -1).limit(1)
        for signal in last_signal:
            signal_value = signal["rsi_signal"]

            if signal_value == 1:
                simulate_trade(signal, "BUY")
            elif signal_value == 2:
                simulate_trade(signal, "SELL")
            elif signal_value == 0:
                print(f"{signal["timestamp"]}: HOLD for {pair}")
            else:
                print(f"{signal["timestamp"]}: Unknown signal ({signal_value}) for {pair}")


if __name__ == "__main__":
    while True:
        check_and_trade()
        print("Waiting 5 minutes...")
        for remaining in range(300, 0, -1):
            mins, secs = divmod(remaining, 60)
            time_format = f"{mins:02d}:{secs:02d}"
            print(f"Next check in: {time_format}", end="\r")
            time.sleep(1)
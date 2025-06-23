import os
import ta
import pandas as pd
from pymongo import MongoClient
from dotenv import find_dotenv, load_dotenv

dotenv_path = find_dotenv()
load_dotenv(dotenv_path)

client = MongoClient(os.getenv("MONGODB_CONNECTION_STRING"))
db = client["oracle"]
collection = db["price_feeds"]
signals_collection = db["rsi_signals"]

def get_signal_rsi(x):
    if x is None:
        return 0
    if x > 70:
        return 2 #SELL
    elif x < 30:
        return 1 #BUY
    else:
        return 0 #HOLD
    
def process_pair(pair: str):
    cursor = collection.find({"pair": pair}).sort("timestamp", -1).limit(100)
    docs = list(cursor)

    if not docs or len(docs) < 15:
        return

    df = pd.DataFrame(docs)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values(by="timestamp").reset_index(drop=True)

    df_resampled = df.resample("5min", on="timestamp").agg({
        "timestamp": "last",
        "pair": "first",
        "price": "last"
    }).dropna().reset_index(drop=True)

    df_resampled["price"] = pd.to_numeric(df_resampled["price"], errors="coerce")
    df_resampled = df_resampled.dropna(subset=["price"])

    if len(df_resampled) < 15:
        return
    
    df_resampled["rsi"] = ta.momentum.RSIIndicator(df_resampled["price"], window=14).rsi()
    df_resampled["rsi_signal"] = df_resampled["rsi"].apply(get_signal_rsi)

    latest_row = df_resampled.iloc[-1]

    signal_doc = {
        "timestamp": latest_row["timestamp"],
        "pair": latest_row["pair"],
        "price": float(latest_row["price"]),
        "rsi": float(latest_row["rsi"]),
        "rsi_signal": int(latest_row["rsi_signal"])
    }

    signals_collection.insert_one(signal_doc)
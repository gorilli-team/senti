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

def get_signal_rsi(x):
    if x is None:
        return 0
    if x > 70:
        return 2
    elif x < 30:
        return 1
    else:
        return 0
    
def process_pair(pair: str):
    cursor = collection.find({"pair": pair}).sort("timestamp", 1)
    docs = list(cursor)
    df = pd.DataFrame(docs)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    
    df = df.sort_values(by="timestamp").reset_index(drop=True)
    df = df.resample("5min", on="timestamp").agg({
        "timestamp": "last",
        "pair": "first",
        "price": "last"
    }).dropna().reset_index()
    
    df["rsi"] = ta.momentum.RSIIndicator(df["price"], window=14).rsi()
    df["rsi_signal"] = df["rsi"].apply(get_signal_rsi)

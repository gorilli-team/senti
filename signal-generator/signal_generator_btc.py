import os
from pymongo import MongoClient
import pandas as pd
from dotenv import find_dotenv, load_dotenv
from utils import get_signal_rsi
import ta

dotenv_path = find_dotenv()
load_dotenv(dotenv_path)

client = MongoClient(os.getenv("MONGODB_CONNECTION_STRING"))
db = client["oracle"]
collection = db["price_feeds"]

cursor_btc = collection.find({"pair": "BTC/USDT"}).sort("timestamp", 1)
docs_btc = list(cursor_btc)
df_btc = pd.DataFrame(docs_btc)
df_btc['timestamp'] = pd.to_datetime(df_btc['timestamp'])

df_btc = df_btc.sort_values(by="timestamp")
df_btc = df_btc.reset_index(drop=True)
df_btc.resample("5min", on="timestamp").agg(
    {
        "timestamp": "last",
        "pair": "first",
        "price": "last"
    }
).reset_index()

df_btc['rsi'] = ta.momentum.RSIIndicator(df_btc['price'], window=14).rsi()
df_btc['rsi_signal'] = df_btc['rsi'].apply(get_signal_rsi)
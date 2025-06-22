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

cursor_eth = collection.find({"pair": "ETH/USDT"}).sort("timestamp", 1)
docs_eth = list(cursor_eth)
df_eth = pd.DataFrame(docs_eth)
df_eth['timestamp'] = pd.to_datetime(df_eth['timestamp'])

df_eth = df_eth.sort_values(by="timestamp")
df_eth = df_eth.reset_index(drop=True)
df_eth.resample("5min", on="timestamp").agg(
    {
        "timestamp": "last",
        "pair": "first",
        "price": "last"
    }
).reset_index()

df_eth['rsi'] = ta.momentum.RSIIndicator(df_eth['price'], window=14).rsi()
df_eth['rsi_signal'] = df_eth['rsi'].apply(get_signal_rsi)
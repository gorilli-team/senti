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

cursor_sol = collection.find({"pair": "SOL/USDT"}).sort("timestamp", 1)
docs_sol = list(cursor_sol)
df_sol = pd.DataFrame(docs_sol)
df_sol['timestamp'] = pd.to_datetime(df_sol["timestamp"])

df_sol = df_sol.sort_values(by="timestamp")
df_sol = df_sol.reset_index(drop=True)
df_sol.resample("5min", on="timestamp").agg(
    {
        "timestamp": "last",
        "pair": "first",
        "price": "last"
    }
).reset_index()

df_sol['rsi'] = ta.momentum.RSIIndicator(df_sol['price'], window=14).rsi()
df_sol['rsi_signal'] = df_sol['rsi'].apply(get_signal_rsi)
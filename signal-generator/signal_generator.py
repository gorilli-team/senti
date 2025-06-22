import os
from pymongo import MongoClient
import pandas as pd
from dotenv import find_dotenv, load_dotenv
from utils import get_signal_rsi

dotenv_path = find_dotenv()
load_dotenv(dotenv_path)

client = MongoClient(os.getenv("MONGODB_CONNECTION_STRING"))
db = client["oracle"]
collection = db["price_feeds"]

cursor_btc = collection.find({"pair": "BTC/USDT"}).sort("timestamp", 1)
docs_btc = list(cursor_btc)
df_btc = pd.DataFrame(docs_btc)
df_btc['timestamp'] = pd.to_datetime(df_btc['timestamp'])

cursor_eth = collection.find({"pair": "ETH/USDT"}).sort("timestamp", 1)
docs_eth = list(cursor_eth)
df_eth = pd.DataFrame(docs_eth)
df_eth['timestamp'] = pd.to_datetime(df_eth['timestamp'])

cursor_sol = collection.find({"pair": "SOL/USDT"}).sort("timestamp", 1)
docs_sol = list(cursor_sol)
df_sol = pd.DataFrame(docs_sol)
df_sol['timestamp'] = pd.to_datetime(df_sol["timestamp"])
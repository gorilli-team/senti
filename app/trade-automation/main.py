from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import find_dotenv, load_dotenv
import time
from web3 import Web3
import json
from web3.exceptions import ContractLogicError

dotenv_path = find_dotenv()
load_dotenv(dotenv_path)

w3 = Web3(Web3.HTTPProvider(os.getenv("BNB_TESTNET_RPC_URL")))
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
WALLET_ADDRESS = w3.to_checksum_address(os.getenv("WALLET_ADDRESS"))

with open("abi/SentiPool.json") as f:
    pool_abi = json.load(f)

POOL_CONTRACTS = {
    "BTC/USDT": w3.eth.contract(
        address=w3.to_checksum_address("0x468542575f531e75d2c10fafbe56dc1fbc0dffe7"),
        abi=pool_abi
    ),
    "ETH/USDT": w3.eth.contract(
        address=w3.to_checksum_address("0x0111d149930acc0fe7aa36570b94bae287aec2a4"),
        abi=pool_abi
    ),
    "SOL/USDT": w3.eth.contract(
        address=w3.to_checksum_address("0x254b2979bf09226b8341c2a59b06b9962ceaad5a"),
        abi=pool_abi
    )
}

client = MongoClient(os.getenv("MONGODB_CONNECTION_STRING"))
db = client["oracle"]
signals = db["rsi_signals"]
trades = db["executed_trades"]

TRADE_AMOUNT_USDT = 100
TRADE_AMOUNT_TOKEN = 1

def normalize_price(price):
    return float(price) / 1e18

def trade(signal, action: str):
    pair = signal["pair"]
    timestamp = signal["timestamp"]
    raw_price = signal["price"]
    rsi = signal["rsi"]
    price = normalize_price(raw_price)

    contract = POOL_CONTRACTS[pair]

    try:
        nonce = w3.eth.get_transaction_count(WALLET_ADDRESS)
        gas_price = w3.eth.gas_price

        if action == "BUY":
            amount_usdt = Web3.to_wei(TRADE_AMOUNT_USDT, "mwei")
            tx = contract.functions.tokenBtoTokenA(
                amount_usdt
            ).build_transaction({
                "from": WALLET_ADDRESS,
                "nonce": nonce,
                "gasPrice": gas_price,
                "gas": 300_000,
            })

        elif action == "SELL":
            amount_token = Web3.to_wei(TRADE_AMOUNT_TOKEN, "ether")
            tx = contract.functions.tokenAtoTokenB(
                amount_token
            ).build_transaction({
                "from": WALLET_ADDRESS,
                "nonce": nonce,
                "gasPrice": gas_price,
                "gas": 300_000,
            })

        else:
            print(f"Invalid action: {action}")
            return

        signed_tx = w3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        print(f"{timestamp}: {action} on {pair} | price: {price} | tx: {tx_hash.hex()}")

        trade_doc = {
            "pair": pair,
            "action": action,
            "amount_usd": TRADE_AMOUNT_USDT if action == "BUY" else None,
            "amount_token": TRADE_AMOUNT_TOKEN if action == "SELL" else None,
            "price": price,
            "timestamp": timestamp,
            "rsi": rsi,
            "tx_hash": tx_hash.hex()
        }
        trades.insert_one(trade_doc)

    except ContractLogicError as e:
        print(f"Contract error during {action} on {pair}: {str(e)}")
    except Exception as e:
        print(f"Error during {action} on {pair}: {str(e)}")

def check_and_trade():
    pairs = ["BTC/USDT", "ETH/USDT", "SOL/USDT"]
    for pair in pairs:
        last_signal = signals.find({"pair": pair}).sort("timestamp", -1).limit(1)
        for signal in last_signal:
            signal_value = signal["rsi_signal"]

            if signal_value == 1:
                trade(signal, "BUY")
            elif signal_value == 2:
                trade(signal, "SELL")
            elif signal_value == 0:
                print(f'{signal["timestamp"]}: HOLD for {pair}')
            else:
                print(f'{signal["timestamp"]}: Unknown signal ({signal_value}) for {pair}')


if __name__ == "__main__":
    while True:
        check_and_trade()
        print("Waiting 5 minutes...")
        for remaining in range(300, 0, -1):
            mins, secs = divmod(remaining, 60)
            time_format = f"{mins:02d}:{secs:02d}"
            print(f"Next check in: {time_format}", end="\r")
            time.sleep(1)
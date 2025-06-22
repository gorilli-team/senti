import time
from utils import process_pair

pairs = ["BTC/USDT", "ETH/USDT", "SOL/USDT"]
for pair in pairs:
    process_pair(pair)

def run_loop():
    while True:
        print("Starting signal update...")
        for pair in pairs:
            try:
                print(f"Processing {pair}")
                process_pair(pair)
            except Exception as e:
                print(f"Error processing {pair}: {e}")
        print("Update complete.")
        time.sleep(300)

if __name__ == "__main__":
    run_loop()
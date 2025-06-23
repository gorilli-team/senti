import time
import sys
from utils.utils import process_pair

pairs = ["BTC/USDT", "ETH/USDT", "SOL/USDT"]

def run_loop():
    while True:
        print("Starting signal update...")
        for pair in pairs:
            try:
                print(f"Processing {pair}")
                process_pair(pair)
            except Exception as e:
                print(f"Error processing {pair}: {e}")
                # Continue with other pairs even if one fails
                continue
        print("Update complete.")
        time.sleep(300)

if __name__ == "__main__":
    try:
        # Initial processing
        print("Initial signal processing...")
        for pair in pairs:
            try:
                process_pair(pair)
            except Exception as e:
                print(f"Error in initial processing for {pair}: {e}")
                # Continue with other pairs
                continue
        
        # Start the main loop
        run_loop()
    except KeyboardInterrupt:
        print("Signal generator stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"Fatal error in signal generator: {e}")
        sys.exit(1)
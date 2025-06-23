# Senti App - Oracle and Signal Generator

This is a Heroku-ready application that combines an Oracle service for fetching blockchain price data and a Signal Generator for trading signals.

## Architecture

- **Oracle Service** (Node.js): Fetches price data from blockchain oracles and stores it in MongoDB
- **Signal Generator** (Python): Processes trading pairs and generates signals

## Deployment to Heroku

### Prerequisites

1. Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. Have a Heroku account
3. Git repository set up

### Quick Deploy

1. **Create a new Heroku app:**

   ```bash
   heroku create your-app-name
   ```

2. **Add MongoDB addon:**

   ```bash
   heroku addons:create mongolab:sandbox
   ```

3. **Set environment variables:**

   ```bash
   heroku config:set MONGODB_CONNECTION_STRING="your_mongodb_connection_string"
   heroku config:set GRPC_SERVER_ADDRESS_MAINNET="your_grpc_server_address"
   heroku config:set BNB_MAINNET_RPC_URL="your_bnb_rpc_url"
   heroku config:set PULL_CONTRACT_ADDRESS_BNB="your_contract_address"
   heroku config:set WALLET_ADDRESS="your_wallet_address"
   heroku config:set PRIVATE_KEY="your_private_key"
   ```

4. **Deploy to Heroku:**

   ```bash
   git add .
   git commit -m "Initial Heroku deployment"
   git push heroku main
   ```

5. **Open the app:**
   ```bash
   heroku open
   ```

### Manual Setup

If you prefer to set up manually:

1. **Initialize git repository:**

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create Heroku app:**

   ```bash
   heroku create your-app-name
   ```

3. **Add buildpacks:**

   ```bash
   heroku buildpacks:add heroku/nodejs
   heroku buildpacks:add heroku/python
   ```

4. **Set environment variables** (as shown above)

5. **Deploy:**
   ```bash
   git push heroku main
   ```

## Environment Variables

Make sure to set these environment variables in Heroku:

- `MONGODB_CONNECTION_STRING`: MongoDB connection string
- `GRPC_SERVER_ADDRESS_MAINNET`: gRPC server address for mainnet
- `BNB_MAINNET_RPC_URL`: BNB Chain mainnet RPC URL
- `PULL_CONTRACT_ADDRESS_BNB`: Pull contract address on BNB Chain
- `WALLET_ADDRESS`: Wallet address for transactions
- `PRIVATE_KEY`: Private key for signing transactions

## Local Development

1. **Install dependencies:**

   ```bash
   npm install
   pip install -r requirements.txt
   ```

2. **Set up environment variables** in a `.env` file

3. **Run the application:**
   ```bash
   npm start
   ```

## Project Structure

```
app/
├── oracle/                 # Node.js Oracle service
│   ├── main.js            # Main oracle application
│   ├── package.json       # Node.js dependencies
│   ├── pullServiceClient.js
│   ├── protos/            # Protocol buffer definitions
│   ├── resources/         # Contract ABIs and proofs
│   └── utils/             # Utility functions
├── signal-generator/       # Python Signal Generator
│   ├── main.py            # Main signal generator
│   ├── requirements.txt   # Python dependencies
│   └── utils/             # Utility functions
├── Procfile               # Heroku process definition
├── package.json           # Root package.json
├── requirements.txt       # Root Python requirements
├── runtime.txt            # Python runtime version
├── app.json              # Heroku app configuration
└── README.md             # This file
```

## Monitoring

- **View logs:**

  ```bash
  heroku logs --tail
  ```

- **Check app status:**
  ```bash
  heroku ps
  ```

## Troubleshooting

1. **Build fails:** Check that all dependencies are properly listed in package.json and requirements.txt
2. **Environment variables:** Ensure all required environment variables are set in Heroku
3. **MongoDB connection:** Verify the MongoDB connection string is correct
4. **Python dependencies:** Make sure all Python packages are listed in requirements.txt

## Support

For issues related to:

- Heroku deployment: Check Heroku documentation
- Application logic: Review the code in oracle/ and signal-generator/ directories
- Environment setup: Verify all environment variables are correctly set

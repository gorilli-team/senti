# Privy Wallet Setup

This project uses Privy for wallet authentication. Follow these steps to set up your environment:

## 1. Get Your Privy App ID

1. Go to [Privy Console](https://console.privy.io/)
2. Create a new app or select an existing one
3. Copy your App ID from the dashboard

## 2. Environment Variables

Create a `.env.local` file in the `frontend` directory with the following:

```bash
# Privy Configuration
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
```

Replace `your_privy_app_id_here` with your actual Privy App ID.

## 3. Features

The wallet integration includes:

- **Connect Wallet Button**: Users can connect their wallet or create a new one
- **Multi-chain Support**: Ethereum, Polygon, Optimism, and Arbitrum
- **User Profile**: Shows wallet address and email (if provided)
- **Chain Indicator**: Displays the current network (ETH, MATIC, OP, ARB)
- **Disconnect**: Users can disconnect their wallet

## 4. Usage

The wallet connect button is now available in the dashboard header. Users can:

1. Click "Connect Wallet" to start the connection process
2. Choose between email or wallet-based authentication
3. View their connected wallet information in the dropdown
4. Disconnect their wallet when needed

## 5. Styling

The wallet components use the existing UI components and follow the app's design system. The wallet button shows:

- Loading state while Privy initializes
- "Connect Wallet" when not authenticated
- Wallet address and chain badge when connected

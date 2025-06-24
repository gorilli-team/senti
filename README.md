<div id="readme-top" align="center">
  <div id="readme-top" align="center">
    <h1>Senti</h1>
  </div>

  <p align="center" style="font-size: 24px">
    <strong>Automated trading based on market sentiment.</strong>
    <br />
    <a href="https://senti-permissionless.vercel.app/" style="font-size: 16px"><strong>Visit the website »</strong></a>
    <br />
    <div>
    <div style="display: flex; flex-direction: row; justify-content: center; align-items: center">
    <p>
    <div>
    Powered by
    </p>
        <a href="https://www.gorilli.io/en">
            <img src="./docs/img/gorilli-logo-horizontal.png" alt="Gorilli Logo" width="100" height="40">
        </a>
        </div>
    </div>
  </p>
      </div>
</div>

# Table of contents

<!-- TOC -->
  - [1. Overview](#1-overview)
  - [2. Target audience](#2-target-audience)
  - [3. How to use Senti](#3-how-to-use-senti)
  - [4. Bounties](#4-bounties)
  - [5. Submission details](#5-submission-details)

## 1. Overview

Senti is an automated trading platform that helps users take advantage of the market through accurate and real-time indicators. It leverages the Supra oracle to fetch up-to-date price feeds from major cryptocurrencies and operates on the BNB Smart Chain Testnet. User trading activity is then aggregated to gauge market sentiment and further improve the accuracy of the signals.

## 2. Target audience

Senti is designed for crypto-native users who want to accelerate their trading activity by delegating part of their funds to an automated algorithm. This helps them eliminate impulsive behavior and trade only when selected indicators signal the right time to enter the market.

It also serves as a tool for information aggregation, providing an accurate picture of market sentiment by analyzing users' trading activity on the platform.

## 3. How to use Senti
<strong>1- Connect your wallet via Privy</strong><br>
<img src="./docs/img/connect-wallet.png" alt="Connect Wallet" width="600" height="300">
<br>
<br>
<strong>2- Check the current market sentiment based on users' activity</strong>
<img src="./docs/img/homepage.png" alt="Homepage" width="600" height="300">
<br>
<br>
<strong>3- All the latest market signals are displayed in the homepage, together with price information and current users' trades.</strong>
<img src="./docs/img/market-signals.png" alt="Market Signals" width="600" height="350">
<br>
<br>
<strong>4- The market sentiment section dives deep into the CMC Fear & Greed index, giving historical information on the index and displaying statistics regarding the crypto market.</strong><br>
<img src="./docs/img/sentiment-analysis.png" alt="Sentiment Analysis" width="600" height="350">
<br>
<br>
<strong>5- Users can see a complete list of all the trading actions in the Trading History page, as well as the total volume traded, buy/sell ratio, and other trading statistics.</strong><br>
<img src="./docs/img/trading-history.png" alt="Trading History" width="600" height="350">
  
## 4. Bounties
- Supra:
  - <strong>On-Chain Automation Unleashed:</strong> Developed a signal generation algorithm that automates users' trading activity directly on-chain.

  - <strong>AI Agents + Supra: Smarter Contracts:</strong> Price feeds for BTC/USDT, ETH/USDT, and SOL/USDT are continuously fetched via the Supra oracle. Senti pulls data from the BNB Testnet Pull Contract (0x6Cd59830AAD978446e6cc7f6cc173aF7656Fb917) every minute. The raw data is then resampled to generate trading signals using the RSI indicator every 5 minutes.
  
- BNB:
  - <strong>AI:</strong> Senti acts as a Personalized Financial Advisor, guiding users through the market and maximizing their results. Our solution is unbiased and unaffected by human psychology, eliminating impulsive behavior and panic selling to enable users to trade at their best.

- <strong>Trojan Trading:</strong>
  - <strong>Microservice for Memecoin Trading Analytics:</strong> Senti analyzes the market to identify the best trading opportunities using real-time price feeds and a signal generator script based on the RSI indicator. The system is designed to be extensible, allowing unlimited integration of new indicators, unlocking the full potential of the signal generation engine for various use cases.

## 5. Submission details

- GitHub Repository: https://github.com/gorilli-team/senti
- Link to the project: [senti-permissionless.vercel.app](https://senti-permissionless.vercel.app/)
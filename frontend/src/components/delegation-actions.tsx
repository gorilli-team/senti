"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, ArrowDownUp, Loader2 } from "lucide-react";
import { ethers } from "ethers";
import DelegationManagerABI from "@/abi/DelegationManager.json";

// Contract addresses (BSC Testnet)
const DELEGATION_MANAGER_ADDRESS = "0x04cb3164cff0db906aeef078fcb13be60ba6d402";
const TOKEN_ADDRESSES = {
  BTC: "0x14f66098ecf073e9a0213939ec7d92143b69ed2b",
  ETH: "0xfa0a3aa71cc27950dce6bbe13f7d46e975fde4d4",
  SOL: "0x30dc8d1bd346b485d9d919515bf10af098ed5e2b",
  USDT: "0xc3191f48f83019d289f1c9748a36c67748cb1588",
};

interface TokenBalance {
  [key: string]: string;
}

export function DelegationActions() {
  const { user, authenticated, ready, sendTransaction } = usePrivy();
  const [selectedToken, setSelectedToken] = useState<string>("BTC");
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [balances, setBalances] = useState<TokenBalance>({});
  const [delegatedBalances, setDelegatedBalances] = useState<TokenBalance>({});

  // Create a simple provider for read operations
  const getProvider = () => {
    return new ethers.JsonRpcProvider(
      "https://data-seed-prebsc-1-s1.binance.org:8545"
    );
  };

  // Get contract instance for read operations
  const getContract = () => {
    const provider = getProvider();
    return new ethers.Contract(
      DELEGATION_MANAGER_ADDRESS,
      DelegationManagerABI,
      provider
    );
  };

  // Get token contract instance for read operations
  const getTokenContract = (tokenAddress: string) => {
    const provider = getProvider();
    const tokenABI = [
      "function balanceOf(address owner) view returns (uint256)",
      "function approve(address spender, uint256 amount) returns (bool)",
      "function allowance(address owner, address spender) view returns (uint256)",
      "function decimals() view returns (uint8)",
    ];
    return new ethers.Contract(tokenAddress, tokenABI, provider);
  };

  // Fetch balances
  const fetchBalances = async () => {
    if (!user?.wallet?.address) return;

    const newBalances: TokenBalance = {};
    const newDelegatedBalances: TokenBalance = {};

    try {
      const contract = getContract();

      for (const [tokenName, tokenAddress] of Object.entries(TOKEN_ADDRESSES)) {
        const tokenContract = getTokenContract(tokenAddress);

        // Get token balance
        const balance = await tokenContract.balanceOf(user.wallet.address);
        const decimals = await tokenContract.decimals();
        newBalances[tokenName] = ethers.formatUnits(balance, decimals);

        // Get delegated balance
        const delegatedBalance = await contract.s_delegatedBalances(
          user.wallet.address,
          tokenAddress
        );
        newDelegatedBalances[tokenName] = ethers.formatUnits(
          delegatedBalance,
          decimals
        );
      }

      setBalances(newBalances);
      setDelegatedBalances(newDelegatedBalances);
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  };

  // Handle deposit
  const handleDeposit = async () => {
    if (!amount || !user?.wallet?.address) return;

    setIsLoading(true);
    try {
      const amountWei = ethers.parseUnits(amount, 18);
      const tokenAddress =
        TOKEN_ADDRESSES[selectedToken as keyof typeof TOKEN_ADDRESSES];

      // First approve the delegation manager to spend tokens
      const tokenABI = [
        "function approve(address spender, uint256 amount) returns (bool)",
      ];
      const tokenContract = new ethers.Contract(tokenAddress, tokenABI);

      const approveData = tokenContract.interface.encodeFunctionData(
        "approve",
        [DELEGATION_MANAGER_ADDRESS, amountWei]
      );

      const approveTx = await sendTransaction({
        to: tokenAddress,
        data: approveData,
      });

      // Wait for approval transaction
      const provider = getProvider();
      await provider.waitForTransaction(approveTx.hash);

      // Then deposit
      const contract = new ethers.Contract(
        DELEGATION_MANAGER_ADDRESS,
        DelegationManagerABI
      );
      const depositData = contract.interface.encodeFunctionData(
        "depositToAllowedOperator",
        [tokenAddress, amountWei]
      );

      const depositTx = await sendTransaction({
        to: DELEGATION_MANAGER_ADDRESS,
        data: depositData,
      });

      // Wait for deposit transaction
      await provider.waitForTransaction(depositTx.hash);

      // Refresh balances
      await fetchBalances();
      setAmount("");
      alert("Deposit successful!");
    } catch (error) {
      console.error("Error depositing:", error);
      alert("Deposit failed. Please check your balance and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle withdraw
  const handleWithdraw = async () => {
    if (!amount || !user?.wallet?.address) return;

    setIsLoading(true);
    try {
      const amountWei = ethers.parseUnits(amount, 18);
      const tokenAddress =
        TOKEN_ADDRESSES[selectedToken as keyof typeof TOKEN_ADDRESSES];

      const contract = new ethers.Contract(
        DELEGATION_MANAGER_ADDRESS,
        DelegationManagerABI
      );
      const withdrawData = contract.interface.encodeFunctionData(
        "claimFromAllowedOperator",
        [tokenAddress, amountWei]
      );

      const withdrawTx = await sendTransaction({
        to: DELEGATION_MANAGER_ADDRESS,
        data: withdrawData,
      });

      // Wait for withdrawal transaction
      const provider = getProvider();
      await provider.waitForTransaction(withdrawTx.hash);

      // Refresh balances
      await fetchBalances();
      setAmount("");
      alert("Withdrawal successful!");
    } catch (error) {
      console.error("Error withdrawing:", error);
      alert(
        "Withdrawal failed. Please check your delegated balance and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch balances on mount and when user changes
  useEffect(() => {
    if (authenticated && user?.wallet?.address) {
      fetchBalances();
    }
  }, [authenticated, user?.wallet?.address]);

  if (!ready || !authenticated) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Token Selection */}
      <div className="space-y-2">
        <Label htmlFor="token">Select Token</Label>
        <Select value={selectedToken} onValueChange={setSelectedToken}>
          <SelectTrigger>
            <SelectValue placeholder="Select a token" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(TOKEN_ADDRESSES).map((token) => (
              <SelectItem key={token} value={token}>
                {token}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Balances Display */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm text-gray-600">Wallet Balance</p>
          <p className="font-semibold">
            {balances[selectedToken] || "0"} {selectedToken}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Delegated Balance</p>
          <p className="font-semibold">
            {delegatedBalances[selectedToken] || "0"} {selectedToken}
          </p>
        </div>
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isLoading}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleDeposit}
          disabled={isLoading || !amount}
          className="flex-1"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowUpDown className="mr-2 h-4 w-4" />
          )}
          Deposit
        </Button>
        <Button
          onClick={handleWithdraw}
          disabled={isLoading || !amount}
          variant="outline"
          className="flex-1"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowDownUp className="mr-2 h-4 w-4" />
          )}
          Withdraw
        </Button>
      </div>

      {/* Refresh Button */}
      <Button
        onClick={fetchBalances}
        variant="ghost"
        size="sm"
        className="w-full"
      >
        Refresh Balances
      </Button>
    </div>
  );
}

require("dotenv").config();
const PullServiceClient = require("./pullServiceClient");
const { Web3 } = require("web3");
const { MongoClient } = require("mongodb")
const { getSymbolFromId } = require("./utils/utils.js")

const mongoClient = new MongoClient(process.env.MONGODB_CONNECTION_STRING);
let mongoDb;

async function initMongo() {
  if (!mongoDb) {
    await mongoClient.connect();
    mongoDb = mongoClient.db("oracle")
  }
  return mongoDb.collection("price_feeds")
}

async function main() {
  const address = process.env.GRPC_SERVER_ADDRESS_TESTNET;
  const pairIndexes = [0, 1, 10]; // BTC/USDT, ETH/USDT, SOL/USDT
  const chainType = "evm";

  const client = new PullServiceClient(address);

  const request = {
    pair_indexes: pairIndexes,
    chain_type: chainType,
  };

  console.log("Requesting proof for price index : ", request.pair_indexes);
  client.getProof(request, (err, response) => {
    if (err) {
      console.error("Error:", err.details);
      return;
    }
    console.log("Calling contract to verify the proofs...");
    callContract(response.evm);
  });

  async function callContract(response) {
    const web3 = new Web3(
      new Web3.providers.HttpProvider(process.env.BNB_TESTNET_RPC_URL)
    );
    const contractAbi = require("./resources/abi.json");
    const contractAddress = process.env.PULL_CONTRACT_ADDRESS_BNB;
    const contract = new web3.eth.Contract(contractAbi, contractAddress);
    const hex = web3.utils.bytesToHex(response.proof_bytes);

    //////////// Utility code for deserialising oracle proof bytes ////////////

    const OracleProofABI = require("./resources/oracleProof.json");

    let proof_data = web3.eth.abi.decodeParameters(OracleProofABI, hex);

    let pairId = [];
    let pairPrice = [];
    let pairDecimal = [];
    let pairTimestamp = [];

    for (let i = 0; i < proof_data[0].data.length; ++i) {
      for (
        let j = 0;
        j < proof_data[0].data[i].committee_data.committee_feed.length;
        j++
      ) {
        pairId.push(
          proof_data[0].data[i].committee_data.committee_feed[j].pair.toString(
            10
          )
        ); // pushing the pair ids requested in the output vector
        pairPrice.push(
          proof_data[0].data[i].committee_data.committee_feed[j].price.toString(
            10
          )
        ); // pushing the pair price for the corresponding ids
        pairDecimal.push(
          proof_data[0].data[i].committee_data.committee_feed[
            j
          ].decimals.toString(10)
        ); // pushing the pair decimals for the corresponding ids requested
        pairTimestamp.push(
          proof_data[0].data[i].committee_data.committee_feed[
            j
          ].timestamp.toString(10)
        ); // pushing the pair timestamp for the corresponding ids requested
      }
    }

    const collection = await initMongo();

    for (let i = 0; i < pairId.length; i++) {
      const doc = {
        pair: getSymbolFromId(pairId[i]),
        price: pairPrice[i],
        decimals: parseInt(pairDecimal[i]),
        timestamp: new Date(parseInt(pairTimestamp[i])),
      }

      await collection.insertOne(doc);
    }

    console.log("Pair index : ", pairId);
    console.log("Pair Price : ", pairPrice);
    console.log("Pair Decimal : ", pairDecimal);
    console.log("Pair Timestamp : ", pairTimestamp);

    /////////// End of code for deserialising oracle proof bytes ////////////

    const txData = contract.methods.verifyOracleProof(hex).encodeABI();
    const gasEstimate = await contract.methods
      .verifyOracleProof(hex)
      .estimateGas({ from: process.env.WALLET_ADDRESS });

    const transactionObject = {
      from: process.env.WALLET_ADDRESS,
      to: contractAddress,
      data: txData,
      gas: gasEstimate,
      gasPrice: await web3.eth.getGasPrice(),
    };

    const signedTransaction = await web3.eth.accounts.signTransaction(
      transactionObject,
      process.env.PRIVATE_KEY
    );

    const receipt = await web3.eth.sendSignedTransaction(
      signedTransaction.rawTransaction,
      null,
      { checkRevertBeforeSending: false }
    );
    console.log("Transaction receipt:", receipt);
  }
}

const INTERVAL_SECONDS = 60;

(async () => {
  await main();

  setInterval(async () => {
    try {
      await main();
    } catch (err) {
      console.error("Error in main loop:", err);
    }
  }, INTERVAL_SECONDS * 1000);
})();

const IconService = require("icon-sdk-js");
const {
  IconBuilder,
  IconConverter,
  HttpProvider,
  IconWallet,
  IconAmount,
} = IconService;

const dotenv = require("dotenv");
require("dotenv").config();
const provider = new HttpProvider("https://bicon.net.solidwallet.io/api/v3");
const iconService = new IconService(provider);
const deployer_wallet = IconWallet.loadPrivateKey(process.env.PRIV_KEY);
const score_address = "cxcb1fe95bd94143891493f1ddf6ca920b31dcbd99";

const BandChain = require("@bandprotocol/bandchain.js");
const endpoint = "http://guanyu-devnet.bandchain.org/rest";
const getRandomNumber = async () => {
  // Instantiating BandChain with REST endpoint
  const bandchain = new BandChain(endpoint);

  // Create an instance of OracleScript with the script ID
  const oracleScript = await bandchain.getOracleScript(11);

  // Create a new request, which will block until the tx is confirmed
  try {
    const minCount = 3;
    const askCount = 4;
    const mnemonic =
      "panther winner rain empower olympic attract find satoshi meadow panda job ten urge warfare piece walnut help jump usage vicious neither shallow mule laundry";
    const requestId = await bandchain.submitRequestTx(
      oracleScript,
      {
        size: 1,
      },
      { minCount, askCount },
      mnemonic
    );

    // Get final result (blocking until the reports & aggregations are finished)
    const finalResult = await bandchain.getRequestResult(requestId);
    const nonEVMProof = await bandchain.getRequestNonEVMProof(requestId);
    return nonEVMProof;
  } catch {
    console.error("Data request failed");
  }
};

set_number = async () => {
  let nonevmproof = await getRandomNumber();
  console.log(nonevmproof);
  const txObj = new IconBuilder.CallTransactionBuilder()
    .from(deployer_wallet.getAddress())
    .to(score_address)
    .stepLimit(IconConverter.toBigNumber("200000"))
    .nid(IconConverter.toBigNumber("3"))
    .nonce(IconConverter.toBigNumber("1"))
    .version(IconConverter.toBigNumber("3"))
    .timestamp(new Date().getTime() * 1000)
    .method("set_number")
    .params({
      proof: nonevmproof,
    })
    .build();
  const signedTransaction = new IconService.SignedTransaction(
    txObj,
    deployer_wallet
  );
  let txHash;
  try {
    txHash = await iconService.sendTransaction(signedTransaction).execute();
  } catch (e) {
    console.log("Error", e);
  }
  console.log(txHash);
  let check = false;
  let loading = true;
  while (check !== true && txHash) {
    try {
      const transactionResult = await iconService
        .getTransactionResult(txHash)
        .execute();
      console.log(
        "transaction status(1:success, 0:failure): " + transactionResult.status
      );
      check = true;
    } catch (e) {
      console.log("Trying again...");
    }
  }
  loading = false;
};

set_number();
import React, { Component, Fragment } from "react";
import Container from "react-bootstrap/Container";
import IconService from "icon-sdk-js";
import PRIV_KEY from "./config";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

const {
  IconBuilder,
  IconConverter,
  HttpProvider,
  IconWallet,
  IconAmount,
} = IconService;
const provider = new HttpProvider("https://bicon.net.solidwallet.io/api/v3");
const iconService = new IconService(provider);
const deployer_wallet = IconWallet.loadPrivateKey(PRIV_KEY);
const caller_wallet = IconWallet.create();
// console.log(caller_wallet)
const score_address = "cx5d432d5374f1bea3a19a9e4644f810836a66eefe";

class App extends Component {
  state = {
    gameStatus: null,
    selectedAddress: deployer_wallet.getAddress(),
    selectedWallet: null,
    nonEvmProof:
      "0000000c62616e64636861696e2e6a73000000000000000b000000080000000000000001000000000000000200000000000000010000000c62616e64636861696e2e6a73000000000000a2e00000000000000002000000005f3619ba000000005f3619bd0100000006000000023130",
    upper: 92,
    lower: 21,
    side_bet_amount: 0.01,
    side_bet_type: "digits_match",
    main_bet_amount: 1,
    result: ""
  };

  componentDidMount = async () => {
    this.prerequisties();
    const { CallBuilder } = IconBuilder;
    const callBuilder = new CallBuilder();
    const call = callBuilder
      .from(deployer_wallet.getAddress())
      .to(score_address)
      .method("get_game_status")
      .build();
    const result = await iconService.call(call).execute();
    if (result === "0x1") {
      this.setState({ gameStatus: true });
    } else {
      this.setState({ gameStatus: false });
    }
    console.log(result);
  };

  prerequisties = () => {
    if (this.state.selectedAddress === deployer_wallet.getAddress()) {
      this.setState({ selectedWallet: deployer_wallet });
      console.log("deployer ", this.state.selectedWallet);
    } else if (this.state.selectedAddress === caller_wallet.getAddress()) {
      this.setState({ selectedWallet: caller_wallet });
      console.log("caller ", this.state.selectedWallet);
    } else {
      console.log("Not selected...");
    }
  };

  isGameOn = async () => {
    const { CallBuilder } = IconBuilder;
    const callBuilder = new CallBuilder();
    const call = callBuilder
      .from(deployer_wallet.getAddress())
      .to(score_address)
      .method("get_game_status")
      .build();
    const result = await iconService.call(call).execute();
    if (result === "0x1") {
      this.setState({ gameStatus: true });
    } else {
      this.setState({ gameStatus: false });
    }
    console.log(result);
  };

  toggleGame = async () => {
    this.prerequisties();
    const { selectedWallet } = this.state;
    const txObj = new IconBuilder.CallTransactionBuilder()
      .from(selectedWallet.getAddress()) // selected
      .to(score_address)
      .stepLimit(IconConverter.toBigNumber("200000000"))
      .nid(IconConverter.toBigNumber("3"))
      .nonce(IconConverter.toBigNumber("1"))
      .version(IconConverter.toBigNumber("3"))
      .timestamp(new Date().getTime() * 1000)
      .method("toggle_game_status")
      .build();
    console.log("CallTransactionBuilder called.");
    const signedTransaction = new IconService.SignedTransaction(
      txObj,
      selectedWallet
    );
    const txHash = await iconService
      .sendTransaction(signedTransaction)
      .execute();
    console.log(txHash);
    let check = false;
    while (check !== true) {
      try {
        const transactionResult = await iconService
          .getTransactionResult(txHash)
          .execute();
        console.log(
          "transaction status(1:success, 0:failure): " +
            transactionResult.status
        );
        check = true;
        this.setState({ gameStatus: !this.state.gameStatus });
      } catch (e) {
        console.log("Trying again...");
      }
    }
  };

  callBet = async () => {
    this.prerequisties();
    const {
      upper,
      lower,
      side_bet_amount,
      side_bet_type,
      nonEvmProof,
      selectedWallet,
      main_bet_amount
    } = this.state;
    const txObj = new IconBuilder.CallTransactionBuilder()
      .from(selectedWallet.getAddress()) // selected
      .to(score_address)
      .stepLimit(IconConverter.toBigNumber("200000000"))
      .nid(IconConverter.toBigNumber("3"))
      .nonce(IconConverter.toBigNumber("1"))
      .value(IconAmount.of((main_bet_amount + side_bet_amount), IconAmount.Unit.ICX).toLoop())
      .version(IconConverter.toBigNumber("3"))
      .timestamp(new Date().getTime() * 1000)
      .method("call_bet")
      .params({
        upper: IconConverter.toHex(IconConverter.toBigNumber(upper)),
        lower: IconConverter.toHex(IconConverter.toBigNumber(lower)),
        proof: nonEvmProof,
        side_bet_amount: IconConverter.toHex(
          IconConverter.toBigNumber(
            IconAmount.of(side_bet_amount, IconAmount.Unit.ICX).toLoop()
          )
        ),
        side_bet_type: side_bet_type,
      })
      .build();
    console.log("CallTransactionBuilder called.");
    const signedTransaction = new IconService.SignedTransaction(
      txObj,
      selectedWallet
    );
    console.log(signedTransaction.getProperties())
    const txHash = await iconService
      .sendTransaction(signedTransaction)
      .execute();
    console.log(txHash);
    let check = false;
    while (check !== true) {
      try {
        const transactionResult = await iconService
          .getTransactionResult(txHash)
          .execute();
        const win =  transactionResult.eventLogs.filter(a => a.indexed[0] === "BetResult(int,str,int)")
        console.log(win[0].indexed[2])
        this.setState({result: win[0].indexed[2]})
        console.log(
          "transaction status(1:success, 0:failure): " +
            transactionResult.status
        );
        check = true;
      } catch (e) {
        console.log("Trying again...");
      }
    }
  };

  transaction = async () => {
    const txObj = new IconBuilder.IcxTransactionBuilder()
      .from(deployer_wallet.getAddress())
      .to(score_address)
      .value(IconAmount.of(40, IconAmount.Unit.ICX).toLoop()) //IconAmount.of(10, IconAmount.Unit.ICX).toLoop()
      .stepLimit(IconConverter.toBigNumber(100000000))
      .nid(IconConverter.toBigNumber(3))
      .nonce(IconConverter.toBigNumber(1))
      .version(IconConverter.toBigNumber(3))
      .timestamp(new Date().getTime() * 1000)
      .build();
    const signedTransaction = new IconService.SignedTransaction(
      txObj,
      deployer_wallet
    );
    const txHash = await iconService
      .sendTransaction(signedTransaction)
      .execute();
    // Print transaction hash
    console.log(txHash);
    let check = false;
    while (check !== true) {
      try {
        const transactionResult = await iconService
          .getTransactionResult(txHash)
          .execute();
        console.log(
          "transaction status(1:success, 0:failure): " +
            transactionResult.status
        );
        check = true;
      } catch (e) {
        console.log("Trying again...");
      }
    }
  };

  getBandchainProof = async () => {
    const BandChain = require("@bandprotocol/bandchain.js");
    const endpoint = "http://guanyu-devnet.bandchain.org/rest";
    const mnemonic =
      "ask jar coast prison educate decide elephant find pigeon truth reason double figure enroll scheme melt soldier damage debris recall brief jeans million essence";
    const oracleScriptID = 11;
    const minCount = 1;
    const askCount = 2;
    const gasAmount = 100;
    const gasLimit = 300000;

    (async () => {
      const bandchain = new BandChain(endpoint);
      const oracleScript = await bandchain.getOracleScript(oracleScriptID);
      try {
        const requestID = await bandchain.submitRequestTx(
          oracleScript,
          { size: 1 },
          { minCount, askCount },
          mnemonic,
          gasAmount,
          gasLimit
        );
        const nonEvmProof = await bandchain.getRequestNonEVMProof(requestID);
        console.log(nonEvmProof);
        this.setState({ nonEvmProof: nonEvmProof });
      } catch (e) {
        console.error("Data request failed with reason: ", e);
      }
    })();
  };

  handleSubmit = async (event) => {
    event.preventDefault();
    if (this.state.upper - this.state.lower >= 6) {
      console.log("Submitted");
    } else {
      console.log("Difference should be 6 or more");
    }
  };

  handleChange = (event) => {
    const { value, name } = event.target;
    this.setState({ [name]: value });
  };

  render() {
    const {
      upper,
      lower,
      side_bet_amount,
      side_bet_type,
      nonEvmProof,
      selectedAddress,
      main_bet_amount,
      result
    } = this.state;
    return (
      <Fragment>
        <Container>
          <Form.Group controlId="exampleForm.ControlSelect1">
            <Form.Label>Select Address</Form.Label>
            <Form.Control
              as="select"
              type="text"
              name="selectedAddress"
              value={selectedAddress}
              onChange={this.handleChange}
            >
              <option>{deployer_wallet.getAddress()}</option>
              <option>{caller_wallet.getAddress()}</option>
            </Form.Control>
          </Form.Group>
          <p>Deployer Address: {deployer_wallet.getAddress()}</p>
          <p>Caller Address: {caller_wallet.getAddress()}</p>
          <p> Load funds in the caller address from ibriz faucet. </p>
          <Button onClick={this.isGameOn}> Game Status </Button>
          {this.state.gameStatus ? <p> The game is on. </p> : null}
          <p></p>
          <Button onClick={this.prerequisties}> Account Loaded </Button>
          <p></p>
          <Button onClick={this.toggleGame}> Toggle Game Status </Button>
          <p></p>
          <Button onClick={this.getBandchainProof}> Get Proof </Button>
          <p></p>
          <Button onClick={this.transaction}> Transaction </Button>
          {this.state.gameStatus ? (
            <div>
              <Form onSubmit={this.handleSubmit}>
                <Form.Group>
                  <Form.Label>Upper</Form.Label>
                  <Form.Control
                    type="number"
                    name="upper"
                    value={upper}
                    onChange={this.handleChange}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Lower</Form.Label>
                  <Form.Control
                    type="number"
                    name="lower"
                    value={lower}
                    onChange={this.handleChange}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Non Evm Proof</Form.Label>
                  <Form.Control
                    name="nonEvmProof"
                    value={nonEvmProof}
                    onChange={this.handleChange}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Side Bet Amount (in ICX)</Form.Label>
                  <Form.Control
                    type="number"
                    name="side_bet_amount"
                    value={side_bet_amount}
                    onChange={this.handleChange}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Main Bet Amount(in ICX)</Form.Label>
                  <Form.Control
                    type="number"
                    name="main_bet_amount"
                    value={main_bet_amount}
                    onChange={this.handleChange}
                  />
                </Form.Group>
                <Form.Group controlId="exampleForm.ControlSelect1">
                  <Form.Label>Side Bet Type</Form.Label>
                  <Form.Control
                    as="select"
                    type="text"
                    name="side_bet_type"
                    value={side_bet_type}
                    onChange={this.handleChange}
                  >
                    <option>digits_match</option>
                    <option>icon_logo1</option>
                    <option>icon_logo2</option>
                  </Form.Control>
                </Form.Group>
                <Button type="submit">Submit Params</Button>
              </Form>{" "}
            </div>
          ) : null}
          <p></p>
          <Button onClick={this.callBet}> Place Bet </Button>
          <p></p>
          <p> Bet Results: {result} </p>
        </Container>
      </Fragment>
    );
  }
}

export default App;

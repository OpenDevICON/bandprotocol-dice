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
const score_address = "cx6788b178f4c86abb4584d4c2ce7348f55acc153b";

class App extends Component {
  state = {
    gameStatus: null,
    selectedAddress: deployer_wallet.getAddress(),
    selectedWallet: null,
    upper: 92,
    lower: 21,
    side_bet_amount: 0.01,
    side_bet_type: "digits_match",
    main_bet_amount: 1,
    result: "",
    mainPayoutAmount: "",
    sidePayoutAmount: ""
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
    console.log(process.env)
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
  
  callBet = async (event) => {
    event.preventDefault();
    if (this.state.upper - this.state.lower >= 6) {
      console.log("Submitted");
    }
    this.prerequisties();
    const {
      upper,
      lower,
      side_bet_amount,
      side_bet_type,
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
        
        const payoutAmount = transactionResult.eventLogs.filter(a => a.indexed[0] === "PayoutAmount(int,int,int)")
        this.setState({mainPayoutAmount: parseInt(payoutAmount[0].indexed[2])/10 ** 18})
        const win = transactionResult.eventLogs.filter(a => a.indexed[0] === "BetResult(int,str,int)")
        console.log(win[0].indexed[2])
        this.setState({
          result: win[0].indexed[2],
          sidePayoutAmount: parseInt(payoutAmount[0].indexed[3])/10 ** 18
        })
        console.log(payoutAmount[0].indexed[2])
        console.log(payoutAmount[0].indexed[3])
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
          <p> Load funds in the caller address from <b><a href="https://icon-faucet.ibriz.ai/">ibriz faucet</a></b>. </p>
          <Button onClick={this.isGameOn}> Game Status </Button>
          {this.state.gameStatus ? <p> The game is on. </p> : <p> The game is off. </p>}
          <p></p>
          <Button onClick={this.prerequisties}> Account Loaded: </Button>
          <p></p>
          <Button onClick={this.toggleGame}> Toggle Game Status </Button>
          <p></p>
          <Button onClick={this.transaction}> Transaction (Supply 40 ICX to SCORE)</Button>
          {this.state.gameStatus ? (
            <div>
              <Form onSubmit={this.callBet}>
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
                <Button type="submit">Call Bet</Button>
              </Form>{" "}
            </div>
          ) : null}
          <p></p>
          <p> Bet Results: {result} </p>
          <p></p>
          <p> Main Bet Amount: {this.state.mainPayoutAmount} ICX<br/> Side Bet Amount: {this.state.sidePayoutAmount} ICX</p>
        </Container>
      </Fragment>
    );
  }
}

export default App;

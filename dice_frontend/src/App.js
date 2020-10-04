import React, { Component, Fragment } from "react";
import Container from "react-bootstrap/Container";
import IconService from "icon-sdk-js";
import PRIV_KEY from "./config";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { Col, Row, Spinner } from "react-bootstrap";
import InputRange from 'react-input-range';
import 'react-input-range/lib/css/index.css';

import './App.scss';
import Navbar from './components/Navbar';



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
    errorMsg: '',
    loading: false,
    gameStatus: null,
    selectedAddress: deployer_wallet.getAddress(),
    selectedWallet: null,
    upper: 20,
    lower: 2,
    side_bet_amount: 0.01,
    side_bet_type: "digits_match",
    main_bet_amount: 1,
    result: "",
    mainPayoutAmount: "",
    sidePayoutAmount: "",
    bet_range: {
      max: 55,
      min: 5,
    },
  };

  componentDidMount = async () => {
    await this.prerequisties();
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
  };

  toggleGame = async () => {
    await this.prerequisties();
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
    const signedTransaction = new IconService.SignedTransaction(
      txObj,
      selectedWallet
    );
    let txHash;
    try {
      txHash = await iconService
        .sendTransaction(signedTransaction)
        .execute();
    } catch (e) {
      this.setState({errorMsg: e});
    }
    console.log(txHash);
    let check = false;
    this.setState({loading: true});
    while (check !== true && txHash) {
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
        this.setState({errorMsg: ''});
      } catch (e) {
        console.log("Trying again...");
      }
    }
    this.setState({loading: false});
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
    await this.prerequisties();
    const {
      upper,
      lower,
      side_bet_amount,
      side_bet_type,
      selectedWallet,
      main_bet_amount, 
      bet_range
    } = this.state;
    console.log("SELECTED WALLET = ", selectedWallet.getAddress());
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
        upper: IconConverter.toHex(IconConverter.toBigNumber(bet_range.max)),
        lower: IconConverter.toHex(IconConverter.toBigNumber(bet_range.min)),
        side_bet_amount: IconConverter.toHex(
          IconConverter.toBigNumber(
            IconAmount.of(side_bet_amount, IconAmount.Unit.ICX).toLoop()
          )
        ),
        side_bet_type: side_bet_type,
      })
      .build();
      console.log(txObj);
    const signedTransaction = new IconService.SignedTransaction(
      txObj,
      selectedWallet
    );
    let txHash;
    try {
      txHash = await iconService
        .sendTransaction(signedTransaction)
        .execute();
    } catch (e) {
      this.setState({errorMsg: e});
    }
    console.log(txHash);
    let check = false;
    this.setState({loading: true});
    while (check !== true && txHash) {
      try {
        const transactionResult = await iconService
          .getTransactionResult(txHash)
          .execute();
        
        const payoutAmount = transactionResult.eventLogs.filter(a => a.indexed[0] === "PayoutAmount(int,int,int)")
        this.setState({mainPayoutAmount: parseInt(payoutAmount[0].indexed[2])/10 ** 18})
        const win = transactionResult.eventLogs.filter(a => a.indexed[0] === "BetResult(int,str,int)")
        this.setState({
          result: win[0].indexed[2],
          sidePayoutAmount: parseInt(payoutAmount[0].indexed[3])/10 ** 18
        })
        console.log(
          "transaction status(1:success, 0:failure): " +
            transactionResult.status
        );
        check = true;
        this.setState({errorMsg: ''});
      } catch (e) {
        console.log("Trying again...");
        console.log(e);
      }
    }
    this.setState({loading: false});
  };

  handleChange = (event) => {
    const { value, name } = event.target;
    this.setState({ [name]: value });
  };

  handleWalletChange = (walletAddress) => {
    this.setState({ selectedAddress: walletAddress });
  }

  handleBetRangeChange = (range) => {
    if(range.max - range.min >= 6 && range.max-range.min <= 90) {
      this.setState({bet_range: range});
    }
  }

  render() {
    const {
      errorMsg,
      loading,
      upper,
      lower,
      side_bet_amount,
      side_bet_type,
      selectedAddress,
      main_bet_amount,
      result,
      bet_range
    } = this.state;
    return (
      <Fragment>
        
        <Navbar 
          wallets = {[deployer_wallet.getAddress(), caller_wallet.getAddress()]} 
          currentWallet = {selectedAddress} 
          gameStatus = {this.state.gameStatus}
          userStatus = {true}
          handleWalletChange = {this.handleWalletChange}
          handleToggleGameStatus = {this.toggleGame}
        />
        <Container className='container'>
          <Row>
            <Col md={8}>
            {this.state.gameStatus ? (
              <div>
                <h3 className='bet-range-head'>Bet Range</h3>
                <Form onSubmit={this.callBet}>
                  <div className='slider-container mt-4'>
                    <InputRange
                      maxValue={99}
                      minValue={0}
                      value={bet_range}
                      allowSameValues
                      onChange={this.handleBetRangeChange}
                      // draggableTrack
                      // formatLabel={(value, type) => console.log("ffsfd", value, type)}
                    />
                  </div>
                  <div className='form-group-container'>
                  <Form.Group className='form-group'>
                    <Form.Label>Main Bet Amount (ICX)</Form.Label>
                    <Form.Control
                      type="number"
                      name="main_bet_amount"
                      value={main_bet_amount}
                      onChange={this.handleChange}
                    />
                  </Form.Group>
                  </div>
                  <div className='form-group-container'>
                  <Form.Group className='from-group'>
                    <Form.Label>Side Bet Amount (in ICX)</Form.Label>
                    <Form.Control
                      type="number"
                      name="side_bet_amount"
                      value={side_bet_amount}
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
                  </div>
                  <div className='form-group-container'>
                    <Button type="submit" className='btn-success'>Place Bet</Button>
                  </div>
                  {!!errorMsg && <div className='text-red mt-2 mb-2'>{errorMsg}</div>}
                </Form>{" "}
              </div>
            ) : null}
            <p></p>
            <p> Bet Results: {result} </p>
            <p></p>
            <p> Main Bet Amount: {this.state.mainPayoutAmount} ICX<br/> Side Bet Amount: {this.state.sidePayoutAmount} ICX</p>
            </Col>
            <Col md={3} className='right-col'>
              <p>Deployer Address: {deployer_wallet.getAddress()}</p>
              <p>Caller Address: {caller_wallet.getAddress()}</p>
              <p> Load funds from <b><a href="https://icon-faucet.ibriz.ai/">iBriz faucet</a></b>. </p>
            </Col>
          </Row>
          {loading && 
            <>
              <div className='loading-overlay'></div>
                <Spinner
                  className='loading-spinner'
                  as="span"
                  animation="grow"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
            </>
          }
        </Container>
      </Fragment>
    );
  }
}

export default App;

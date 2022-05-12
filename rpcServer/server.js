//Example RPC server / client with "Hello World"
// This RPC server will announce itself as `rpc_test`
// in our Grape Bittorrent network
// When it receives requests, it will answer with 'world'

'use strict'

const { PeerRPCServer }  = require('grenache-nodejs-http')
const Link = require('grenache-nodejs-link')
const axios = require('axios')

const link = new Link({
  grape: 'http://127.0.0.1:30001'
})

let sharedOrderbook = {};
let independantClientOrderbook = {};

let sharedPairTotals = {};
let clientPairTotals = {};
let isLocked = false;


link.start()

const peer = new PeerRPCServer(link, {
  timeout: 300000
})
peer.init()

const port = 1024 + Math.floor(Math.random() * 1000)
const service = peer.transport('server')
service.listen(port)

setInterval(function () {
  link.announce('orderbook_worker', service.port, {})
}, 1000)

service.on('request', async(rid, key, payload, handler) => {

  const clientOrderbookResult = await addToClientOrderBook(payload);
  console.log("Returned clientOrderbookResult:",clientOrderbookResult);
  let sharedOrderbookResult;

  //Only add to shared order book if it is not currently being updated
  if(!isLocked){
    sharedOrderbookResult = await addToSharedOrderBook(payload);
    console.log("sharedOrderbookResult:",sharedOrderbookResult);
    isLocked = false;
  }else{
    console.log("Shared orderbook is being updated currently, please retry...");
  }

  let result = {clientOrderbookResult: clientOrderbookResult, sharedOrderbookResult: sharedOrderbookResult}

  // console.log("Returning result: ",result);
  handler.reply(null, result);
})

/*
Function to add order to shared orderbook amongst all clients
template for orderbook taken from https://www.bitfinex.com/order-book/

sharedOrderbook:
  - keys of format: pair-trade i.e. tBTCUSD-Sell
  - values of format: {id: 'client1',trade: 'Sell',pair: 'tBTCUSD',amount: 1.086,total: 1.086,price: 28658}
*/
async function addToSharedOrderBook(order){
  //set isLocked to true, to prevent a race condition hwne two clients try to add to add To Shared Order Book at the same time
  isLocked = true;
  console.log("Adding order: ",order," to shared order book");

  //Shared orderbook key of format: 'tBTCUSD-Buy'
  let sharedOrderOperation = order.pair+"-"+order.trade;

  console.log("sharedOrderOperation: ",sharedOrderOperation);

  if(!sharedOrderbook[sharedOrderOperation]) {
    console.log("First");
    order.total = order.amount;
    sharedPairTotals[sharedOrderOperation] = order.amount;
    order.price = await retriveTradingPairPrice(order.pair)
    console.log("Returned order price: ",order.price);
    sharedOrderbook[sharedOrderOperation] = [order];
  }else{
    console.log("Multiple");

    //check if order already exists
    if (checkIfClientOrderExists(order,sharedOrderOperation)) {
      console.log("Order already exist and existing order has been increased");
      sharedPairTotals[sharedOrderOperation] = order.amount + sharedPairTotals[sharedOrderOperation];
      order.total = sharedPairTotals[sharedOrderOperation];

    }else {
      console.log("Order does not already exist...");
      sharedPairTotals[sharedOrderOperation] = order.amount + sharedPairTotals[sharedOrderOperation];
      order.total = sharedPairTotals[sharedOrderOperation];
      order.price = await retriveTradingPairPrice(order.pair);
      console.log("Returned order price: ",order.price);
      sharedOrderbook[sharedOrderOperation].push(order);
    }
  }
  console.log("sharedOrderbook: ",sharedOrderbook);
  return sharedOrderbook;
}


/*
Function to add order to independant client orderbook
template for orderbook taken from https://www.bitfinex.com/order-book/

independantClientOrderbook:
  - keys of format: id-pair-trade i.e. client1-tBTCUSD-Sell
  - values of format: {id: 'client1',trade: 'Sell',pair: 'tBTCUSD',amount: 1.086,total: 1.086,price: 28658}
*/
async function addToClientOrderBook (order) {

  console.log("Adding order: ", order, " to orderbook");
  console.log("Setting independantClientOrderbook");

  //independant client orderbook operation of format: 'client1-tBTCUSD-Buy'
  let orderOperation = order.id+'-'+order.pair+'-'+order.trade;
  console.log("orderOperation: ",orderOperation);

  if(!independantClientOrderbook[orderOperation]) {
    order.total = order.amount;
    clientPairTotals[orderOperation] = order.amount;
    order.price = await retriveTradingPairPrice(order.pair)
    console.log("Returned order price: ",order.price);
    independantClientOrderbook[orderOperation] = [order];
  }else{
    clientPairTotals[orderOperation] = order.amount + clientPairTotals[orderOperation];
    order.total = clientPairTotals[orderOperation];
    order.price = await retriveTradingPairPrice(order.pair);
    console.log("Returned order price: ",order.price);
    independantClientOrderbook[orderOperation].push(order);
  }

  console.log("independantClientOrderbook: ",independantClientOrderbook);

  return independantClientOrderbook;

}

//function to retrive trading pair price, given a paticular trading pair from Bitfinex public API
function retriveTradingPairPrice(tradingPair){

  console.log("Retrieving trading pair price from Bitfinex for trading pair: ", tradingPair);

  const baseUrl = "https://api-pub.bitfinex.com/v2/";
  const pathParams = "tickers";
  const queryParams = "symbols="+tradingPair;

  return axios.get(`${baseUrl}/${pathParams}?${queryParams}`)
      .then(response => {
          // console.log(response.data[0]);
          // console.log(response.data[0][7]);
          return response.data[0][7]
      }, error => {
          console.log(error);
      })
}

//If a client's order matches with another order, increment existing order by new order
function checkIfClientOrderExists(order,sharedOrderOperation){

  console.log("Checking if an existing client order already exists");

  // Assuming order already exists if: trade, pair and price are equal
  console.log("sharedOrderbook[operation].length: ",Object.keys(sharedOrderbook[sharedOrderOperation]).length);

  for(let i=0;i<sharedOrderbook[sharedOrderOperation].length;i++){
    console.log("sharedOrderbook[operation][i]: ",sharedOrderbook[sharedOrderOperation][i]);
    if(order.trade === sharedOrderbook[sharedOrderOperation][i].trade && order.pair === sharedOrderbook[sharedOrderOperation][i].pair && order.price === sharedOrderbook[sharedOrderOperation][i].price){
      console.log("Found existing trade: ",sharedOrderbook[sharedOrderOperation][i]);
      //assuming that if trade already exists, we increment the amount of that existing trade by the amount of the new matching trade and increase the total
      sharedOrderbook[sharedOrderOperation][i].amount = sharedOrderbook[sharedOrderOperation][i].amount + order.amount;
      sharedOrderbook[sharedOrderOperation][i].total = sharedOrderbook[sharedOrderOperation][i].total + order.amount;
      return true;
    }
  }
}

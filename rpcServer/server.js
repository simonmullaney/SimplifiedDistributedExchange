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


link.start()

const peer = new PeerRPCServer(link, {
  timeout: 300000
})
peer.init()

const port = 1024 + Math.floor(Math.random() * 1000)
const service = peer.transport('server')
service.listen(port)

setInterval(function () {
  link.announce('rpc_test', service.port, {});
  link.announce('orderbook_worker', service.port, {})
}, 1000)

service.on('request', async(rid, key, payload, handler) => {
  // console.log("rid: ",rid);
  // console.log("key: ",key);
  // console.log("payload: ",payload);
  // console.log("handler: ",handler);

  const clientOrderbookResult = await addToClientOrderBook(payload);
  const sharedOrderbookResult = await addToSharedOrderBook(payload);

  let result = {clientOrderbookResult: clientOrderbookResult, sharedOrderbookResult: sharedOrderbookResult}

  // console.log("Returning result: ",result);

  handler.reply(null, result);
})

// Function to add order to shared orderbook amongst all clients
//Todo: * If a client's order matches with another order, any remainer is added to the orderbook, too.
async function addToSharedOrderBook(order){

  /*
    Orderbook:
      Pair: order.pair
        Trade: order.trade
          id: order.id, Amount:order.amount, Total: calculatePairTotal(), Price: retriveTradingPairPrice()
  */
  console.log("Adding order to shared order book");

  //Shared orderbook operation of format: 'tBTCUSD-Buy'
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
    sharedPairTotals[sharedOrderOperation] = order.amount + sharedPairTotals[sharedOrderOperation];
    order.total = sharedPairTotals[sharedOrderOperation];
    order.price = await retriveTradingPairPrice(order.pair);
    console.log("Returned order price: ",order.price);
    sharedOrderbook[sharedOrderOperation].push(order);
  }

  console.log("sharedOrderbook: ",sharedOrderbook);

  return sharedOrderbook;
}

// Function to add order to independant client orderbook
async function addToClientOrderBook (order) {

  console.log("Adding order: ", order, " to orderbook");

  /*
    independantClientOrderbook:
      Client: order.id
        Pair: order.pair
          Trade: order.trade
            id: order.id, Amount:order.amount, Total: calculateTotal(), Price: c
  */

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

  return independantClientOrderbook[orderOperation];

}


//function to retrive trading pair price given a paticular trading pair
function retriveTradingPairPrice(tradingPair){

  console.log("Retrievig trading pair price from Bitfinex for trading pair: ", tradingPair);

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

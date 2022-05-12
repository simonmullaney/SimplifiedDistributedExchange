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

let orderbook = [];
let independantClientOrderbook = {};
let pairTotals = {};


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

service.on('request', (rid, key, payload, handler) => {
  console.log("rid: ",rid);
  console.log("key: ",key);
  console.log("payload: ",payload);
  console.log("handler: ",handler);

  const result = addToOrderBook(payload)
  handler.reply(null, result)
})


async function addToOrderBook (order) {

  console.log("Adding order: ", order, " to orderbook");

  /*
    Orderbook:
      Pair: order.pair
        Trade: order.trade
          id: order.id, Amount:order.amount, Total: calculatePairTotal(), Price: retriveTradingPairPrice()


    independantClientOrderbook:
      Client: order.id
        Pair: order.pair
          Trade: order.trade
            id: order.id, Amount:order.amount, Total: calculateTotal(), Price: c
  */

  console.log("Settign independantClientOrderbook");

  //order operation of format: 'client1-tBTCUSD-Buy'
  let orderOperation = order.id+'-'+order.pair+'-'+order.trade;
  console.log("orderOperation: ",orderOperation);

  // independantClientOrderbook[orderOperation] = order;

  // orderbook.push(order)
  if(!independantClientOrderbook[orderOperation]) {
    order.total = order.amount;
    pairTotals[orderOperation] = order.amount;
    order.price = await retriveTradingPairPrice(order.pair)
    console.log("Returned order price: ",order.price);

    independantClientOrderbook[orderOperation] = [order]
  }else{
    pairTotals[orderOperation] = order.amount + pairTotals[orderOperation];
    order.total = pairTotals[orderOperation];
    order.price = await retriveTradingPairPrice(order.pair)

    console.log("Returned order price: ",order.price);

    independantClientOrderbook[orderOperation].push(order)
  }

  console.log("independantClientOrderbook: ",independantClientOrderbook);

  return {orderbook:orderbook, independantClientOrderbook: independantClientOrderbook[order.id]}

}


//function to retrive trading pair price given a paticular trading pair
function retriveTradingPairPrice(tradingPair){

  console.log("Retrievig trading pair price from Bitfinex for trading pair: ", tradingPair);

  const baseUrl = "https://api-pub.bitfinex.com/v2/";
  const pathParams = "tickers"
  const queryParams = "symbols="+tradingPair

  return axios.get(`${baseUrl}/${pathParams}?${queryParams}`)
      .then(response => {
          console.log(response.data[0]);
          console.log(response.data[0][7]);
          return response.data[0][7]
      }, error => {
          console.log(error);
      })
}





//function to calculate specific trading pair total
// function calculatePairTotal(order){
//   console.log("Calculating Pair Total for order: ", order);
//   if (order.trade == "Sell") {
//     console.log("Sell order trade, reducing pair total");
//     console.log("Pair: ", order.pair);
//
//   } else if(order.trade == "Buy"){}
//
// }

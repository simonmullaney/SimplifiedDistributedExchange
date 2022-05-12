//Example RPC server / client with "Hello World"
// This RPC server will announce itself as `rpc_test`
// in our Grape Bittorrent network
// When it receives requests, it will answer with 'world'

'use strict'

const { PeerRPCServer }  = require('grenache-nodejs-http')
const Link = require('grenache-nodejs-link')


const link = new Link({
  grape: 'http://127.0.0.1:30001'
})

const orderbook = [];
const independantClientOrderbook = {};


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


function addToOrderBook (order) {

  console.log("Adding order: ", order, " to orderbook");

  /*
    Orderbook:
      Pair: order.pair
          id: order.id, Amount:order.amount, Total: calculateTotal(), Price: retriveTradingPairPrice()


    independantClientOrderbook:
      Client: order.id
        Pair: order.pair
            id: order.id, Amount:order.amount, Total: calculateTotal(), Price: retriveTradingPairPrice()
  */

  orderbook.push(order)
  if (!independantClientOrderbook[order.id]) {
    independantClientOrderbook[order.id] = [order]
  }else{
    independantClientOrderbook[order.id].push(order)
  }

  console.log("independantClientOrderbook: ",independantClientOrderbook);

  return {orderbook:orderbook, independantClientOrderbook: independantClientOrderbook[order.id]}

}

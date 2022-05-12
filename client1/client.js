// This client will as the DHT for a service called `rpc_test`
// and then establishes a P2P connection it.
// It will then send { msg: 'hello' } to the RPC server

'use strict'

const { PeerRPCClient }  = require('grenache-nodejs-http')
const Link = require('grenache-nodejs-link')

const link = new Link({
  grape: 'http://127.0.0.1:30001'
})
link.start()

const peer = new PeerRPCClient(link, {})
peer.init()


const payload = {id:"client1",trade: "Buy", pair: "tBTCUSD", amount: 1.0860}


peer.request('orderbook_worker', payload, { timeout: 100000 }, (err, result) => {
  if (err) throw err
  console.log('Adding order:',payload, 'to orderbook.')
  console.log('Returned orderbooks:');
  console.log('\nclientOrderbookResult: ');
  for (var key in result.clientOrderbookResult) {
    console.log("\Client specific order book:",key,":");
    console.table(result.clientOrderbookResult[key]);
  }
  console.log('\nsharedOrderbookResult: ');
  for (var keys in result.sharedOrderbookResult) {
    console.log("\nShared order book:",keys,":");
    console.table(result.sharedOrderbookResult[keys]);
  }
})

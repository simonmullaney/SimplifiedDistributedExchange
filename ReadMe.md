# The BFX challenge

A simplified distributed exchange

* Each client will have its own instance of the orderbook.
* Clients submit orders to their own instance of orderbook. The order is distributed to other instances, too.
* If a client's order matches with another order, any remainer is added to the orderbook, too.

Requirement:
* Use Grenache for communication between nodes
* Simple order matching engine
* You don't need to create a UI or HTTP API


## Running simplified distributed exchange


### Setting up the DHT

```
npm i -g grenache-grape
```

```
# boot two grape servers

grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002'
grape --dp 20002 --aph 40001 --bn '127.0.0.1:20001'
```

### Setting up Grenache in your project

```
npm install --save grenache-nodejs-http
npm install --save grenache-nodejs-link
```


### Clone this repository


```
git clone https://github.com/simonmullaney/SimplifiedDistributedExchange.git
```

## Running simplified distributed exchange


### Setting up the DHT

```
npm i -g grenache-grape
```

```
# boot two grape servers

grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002'
grape --dp 20002 --aph 40001 --bn '127.0.0.1:20001'
```

### Setting up Grenache in your project

```
git clone https://github.com/simonmullaney/SimplifiedDistributedExchange.git
```

### Setting up the RPC server

Change directory into `rpcSever` and run:

```
npm i
node server.js
```

### Setting up the Clients

Change directory into `client1` and `client2`  respectively and run:

```
npm i
node client.js
```

As each client is started they will automatically send preconfigured trades to the RPC server.

You can change the payload of the respective clients to send different messages to the RPC server:

```
const payload = {id:"client1",trade: "Buy", pair: "tBTCUSD", amount: 1.0860}

```

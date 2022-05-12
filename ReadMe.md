# The BFX challenge

A simplified distributed exchange

* Each client will have its own instance of the orderbook.
* Clients submit orders to their own instance of orderbook. The order is distributed to other instances, too.
* If a client's order matches with another order, any remainer is added to the orderbook, too.

Requirement:
* Use Grenache for communication between nodes
* Simple order matching engine
* You don't need to create a UI or HTTP API

You should not spend more time than 6-8 hours on the task. We know that its probably not possible to complete the task 100% in the given time.


If you don't get to the end, just write up what is missing for a complete implementation of the task. Also, if your implementation has limitation and issues, that's no big deal. Just write everything down and indicate how you could solve them, given there was more time.

Good luck!



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


### Clone the repository

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

As each client is started they will automatically send preconfigured trades to the RPC server

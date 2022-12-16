# Hardhat script for allowing and simulating transactions

Scripting project to fund addresses and allow them to interact with aggregator smart contracts of ethereum.

set allowance:
1) Fund addresses in case they have less than 1 ETH for gas purposes
2) For each token, sends approve transaction for top 5 addresses to be able to swap later on
3) TBD: Sends raw transactions to estimate gas

```shell
npx hardhat node
npx hardhat run scripts/set_allowance.js
```

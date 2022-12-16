require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks: {
    hardhat: {
      forking: {
        enabled: true,
        url: 'https://eth-mainnet.g.alchemy.com/v2/<>'
      },
      chainId: 1
    }
  }
};

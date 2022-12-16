// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const token_erc20_abi = require("../abi/erc20.json");
const token_list_decimals = require("../data/token_list.json");
const ETHEREUM_ADDRESSES = require("../data/token_holders/ethereum.json");

const ETH_WHALE = '0x3DdfA8eC3052539b6C9549F12cEA2C295cfF5296'
const AGG_CONTRACT_SPENDERS = [
        "0x1111111254fb6c44bac0bed2854e76f90643097d"
];

const FROM_ADDRESS = '0x72a53cdbbcc1b9efa39c834a540550e23463aacb';

const TOKEN_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

const NATIVE_TOKEN_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const ERC20_VALUE = 6000000
const GAS_LIMIT = 8000000
const TOKEN_DECIMAL_BASE = "2000000"
const DATA = '0x2e95b6c8000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000000000000000000000000000000000000000017700000000000000000000000000000000000000000000000000000000000000bb30000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000100000000000000003b6d03406491f4cf9c084ef8fc055eaaf735bdceccf69370cfee7c08'

function getERC20Value(token_decimals){
    console.log(token_decimals);
    console.log(hre.ethers.utils.parseUnits(TOKEN_DECIMAL_BASE, token_decimals));
    return hre.ethers.utils.parseUnits(TOKEN_DECIMAL_BASE, token_decimals)
}

async function main() {
    for (let spender in AGG_CONTRACT_SPENDERS) {
        console.log(spender);
        for (let token_address in ETHEREUM_ADDRESSES) {
            console.log(token_address);
            if(token_address != NATIVE_TOKEN_ADDRESS){
                let current_token_decimals = token_list_decimals[token_address];
                console.log(current_token_decimals);

                for (let wallet_address of ETHEREUM_ADDRESSES[token_address]) {
                    console.log(wallet_address);
                    check_if_has_eth(wallet_address).then((wallet_address)=>{
                        console.log("Contract: "+spender+"; From: "+wallet_address+"; Token Address: "+token_address+"; ERC20 Value: "+getERC20Value(current_token_decimals));
                        impersonate_and_allow(spender, wallet_address, token_address, getERC20Value(current_token_decimals));
                    });
                }
            }
        }
    }
}

async function check_if_has_eth(address){
    let signer = await hre.ethers.getImpersonatedSigner(address)
    let balance = await signer.getBalance().then(async (balance) => {
        if (hre.ethers.utils.formatEther(balance) < 1.0) {
            console.log(await address + " has not enough balance")
            await fill_with_gas(address);
            return false;
        }else{
            return true;
        }
    });
}



async function fill_with_gas(to_address) {
    const eth_whale = await hre.ethers.getImpersonatedSigner(ETH_WHALE);
    eth_whale.sendTransaction({
        to: to_address,
        value: hre.ethers.utils.parseEther("1.0"), // Sends exactly 1.0 ether
      }).then(()=>{console.log(address + " was filled with gas (1 ETH)");})

}

async function impersonate_and_allow(spender, from_address, token_address, erc20_value) {
    const impersonatedSigner = await hre.ethers.getImpersonatedSigner(from_address);
    // console.log(await impersonatedSigner.getBalance());


    const destContract = new hre.ethers.Contract(token_address, token_erc20_abi, impersonatedSigner._signer);
    await destContract.approve(spender, erc20_value).then(x => console.log(x), x => console.log(x));

    // const tx = {
    //     to: SPENDER,
    //     value: 0,
    //     data: DATA,
    //     gasLimit: GAS_LIMIT // 100000
    // }

    // await impersonatedSigner.sendTransaction(tx).then((transaction) => {
    //     console.log(impersonatedSigner.getBalance())
    //     console.log(transaction)
    //     console.log('Send finished!')
    // });
}





// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

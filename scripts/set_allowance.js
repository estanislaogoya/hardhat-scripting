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

const ETH_WHALE = "0x3DdfA8eC3052539b6C9549F12cEA2C295cfF5296";
const AGG_CONTRACT_SPENDERS = [
    "0x1111111254fb6c44bac0bed2854e76f90643097d", //1Inch
    "0xdef171fe48cf0115b1d80b88dc8eab59176fee57", //Paraswap
    "0xdef1c0ded9bec7f1a1670819833240f027b25eff", //Matcha
];

const NATIVE_TOKEN_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

const GAS_LIMIT = 8000000;
const TOKEN_DECIMAL_BASE = "9000000";

function getERC20Value(token_decimals) {
    return hre.ethers.utils.parseUnits(TOKEN_DECIMAL_BASE, token_decimals);
}

async function main() {
    for (let spender of AGG_CONTRACT_SPENDERS) {
        for (let token_address in ETHEREUM_ADDRESSES) {
            if (token_address != NATIVE_TOKEN_ADDRESS) {
                let current_token_decimals = token_list_decimals[token_address];
                ETHEREUM_ADDRESSES[token_address].forEach(async wallet_address => {
                    await check_if_has_eth(wallet_address).then(async () => {
                        console.log(
                            "main Contract: " +
                            spender +
                            "; From: " +
                            wallet_address +
                            "; Token Address: " +
                            token_address +
                            "; ERC20 Value: " +
                            getERC20Value(current_token_decimals)
                        );
                        await impersonate_and_allow(
                            spender,
                            wallet_address,
                            token_address,
                            getERC20Value(current_token_decimals)
                        );
                    });

                })
            }
        }
    }
}

async function check_if_has_eth(address) {
    let signer = await hre.ethers.getImpersonatedSigner(address);
    let balance = await signer.getBalance().then(async (balance) => {
        new Promise((resolve, reject) => {
            if (hre.ethers.utils.formatEther(balance) < 1.0) {
                console.log("check_if_has_eth", address + " has not enough balance");
                try {
                    fill_with_gas(address).then(() => resolve());
                } catch (error) {
                    console.log("check_if_has_eth", error);
                }
            } else {
                resolve();
            }
        });
    });
}

async function fill_with_gas(to_address) {
    const eth_whale = await hre.ethers.getImpersonatedSigner(ETH_WHALE);
    try {
        await eth_whale
            .sendTransaction({
                to: to_address,
                gasLimit: GAS_LIMIT,
                value: hre.ethers.utils.parseEther("1.0"), // Sends exactly 1.0 ether
            })
            .then((transaction) => {
                // console.log('fill_with_gas_1',transaction)
                console.log(
                    "fill_with_gas_2",
                    to_address + " was filled with gas (1 ETH)"
                );
            });
    } catch (error) {
        console.log(await get_balance_from_address(ETH_WHALE));
        console.log("fill_with_gas_3", error);
        console.log("Detail Address", to_address);
    }
}

async function get_balance_from_address(
    address
){
    let signer = await hre.ethers.getImpersonatedSigner(address).then(async (signer) => {
        return signer.getBalance();
    }); 
}

async function impersonate_and_allow(
    spender,
    from_address,
    token_address,
    erc20_value
) {
    const impersonatedSigner = await hre.ethers.getImpersonatedSigner(
        from_address
    );
    console.log("impersonate_and_allow", await impersonatedSigner.getBalance());

    const destContract = new hre.ethers.Contract(token_address, token_erc20_abi, impersonatedSigner._signer);
    
    try {
        await destContract
            .approve(spender, erc20_value)
            .then(x => {
                console.log(x);
                console.log("Successfully approved Token")
            });
    } catch (error) {
        // Print log errors to debug: Could be that address already has allowance
        console.log(destContract.allowance(from_address, spender));
        console.log("Error:", error);
        console.log("Spender:", spender);
        console.log("From:", from_address);
        console.log("Token:", token_address);
        console.log("Value:", erc20_value);
    }

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
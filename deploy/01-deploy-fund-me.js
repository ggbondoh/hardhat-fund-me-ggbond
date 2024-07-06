// function deployFunc() {
//     console.log("Hi!");
// }

// module.exports.default = deployFunc;

const { network } = require("hardhat");
const {
    networkConfig,
    developmentChains,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async ({
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) => {
    const { deploy, log, get } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    let ethUsdPriceFeedAddr;
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await get("MockV3Aggregator");
        ethUsdPriceFeedAddr = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddr = networkConfig[chainId]["ethUsdPriceFeed"];
    }
    // if the contract doesn`t exist, we deploy a minimal version of
    // for our local testing

    // well what happens when we want to change chains ?
    // when going for localhost or hardhat network we want to use a mock
    const args = [ethUsdPriceFeedAddr];

    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });
    log("--------------Fundme done at here--------------");

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args);
    }
    log("--------------finish done at here--------------");
};

module.exports.tags = ["all", "fundme"];

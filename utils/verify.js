const { run } = require("hardhat");

const verify = async (contractAddres, args) => {
    try {
        await run("verify:verify", {
            address: contractAddres,
            ConstructorArguments: args,
        });
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("----already verified------");
        } else {
            console.log("------verify error------ : " + e);
        }
    }
};

module.exports = { verify };

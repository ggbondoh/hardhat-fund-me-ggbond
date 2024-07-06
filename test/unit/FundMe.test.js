const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe;
          let deployer;
          let mockV3Aggregator;
          const sendValue = ethers.parseUnits("1", 18); // 1 ETH
          beforeEach(async function () {
              //deploy our fundme contarct using Hardhat-deploy

              // const accounts = await ethers.getSigners();
              // const accountZore = accounts[0];

              deployer = (await getNamedAccounts()).deployer;
              await deployments.fixture(["all"]);
              fundMe = await ethers.getContract("FundMe", deployer);
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer,
              );
          });

          describe("constructor", async function () {
              it("Sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed();
                  const address = await mockV3Aggregator.getAddress();

                  console.log("getPriceFeed response:", response);
                  console.log("MockV3Aggregator address:", address);

                  assert.equal(response, address);
              });
          });

          describe("fund", async function () {
              it("Fails if you don`t send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!",
                  );
              });
              it("updated the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue });
                  const response =
                      await fundMe.getAddressToAmountFunded(deployer);
                  assert.equal(response.toString(), sendValue.toString());
              });
              it("Adds funder to array of funders", async function () {
                  await fundMe.fund({ value: sendValue });
                  const funder = await fundMe.getFunder(0);
                  assert.equal(funder, deployer);
              });
          });

          describe("withdraw", async function () {
              // 在账户中加点钱
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue });
              });

              it("withdraw ETH from a single funders", async function () {
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target);
                  console.log(
                      `startingFundMeBalance == ${startingFundMeBalance}`,
                  );
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  console.log(
                      `startingDeployerBalance == ${startingDeployerBalance}`,
                  );

                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { gasPrice, gasUsed } = transactionReceipt;
                  const gasCost = gasPrice * gasUsed;
                  console.log(`gasCost == ${gasCost}`);
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.target,
                  );
                  console.log(`endingFundMeBalance == ${endingFundMeBalance}`);
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  console.log(
                      `endingDeployerBalance == ${endingDeployerBalance}`,
                  );

                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      (
                          startingFundMeBalance + startingDeployerBalance
                      ).toString(),
                      (endingDeployerBalance + gasCost).toString(),
                  );
              });

              it("allows us to withdraw with mutiple funders", async function () {
                  console.log(
                      "start allows us to withdraw with mutiple funders test",
                  );
                  const accounts = await ethers.getSigners();
                  // zero index is deployer, so start from one
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i],
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });

                      const startingFundMeBalance =
                          await ethers.provider.getBalance(fundMe.target);
                      console.log(
                          `startingFundMeBalance == ${startingFundMeBalance}`,
                      );
                      const startingDeployerBalance =
                          await ethers.provider.getBalance(deployer);
                      console.log(
                          `startingDeployerBalance == ${startingDeployerBalance}`,
                      );

                      const transactionResponse = await fundMe.withdraw();
                      const transactionReceipt =
                          await transactionResponse.wait(1);
                      const { gasPrice, gasUsed } = transactionReceipt;
                      const gasCost = gasPrice * gasUsed;
                      console.log(`gasCost == ${gasCost}`);
                      const endingFundMeBalance =
                          await ethers.provider.getBalance(fundMe.target);
                      console.log(
                          `endingFundMeBalance == ${endingFundMeBalance}`,
                      );
                      const endingDeployerBalance =
                          await ethers.provider.getBalance(deployer);
                      console.log(
                          `endingDeployerBalance == ${endingDeployerBalance}`,
                      );

                      assert.equal(endingFundMeBalance, 0);
                      assert.equal(
                          (
                              startingFundMeBalance + startingDeployerBalance
                          ).toString(),
                          (endingDeployerBalance + gasCost).toString(),
                      );

                      // make sure that the funders are reset properly
                      await expect(fundMe.getFunder(0)).to.be.reverted;

                      for (i = 1; i < 6; i++) {
                          assert.equal(
                              await fundMe.getAddressToAmountFunded(
                                  accounts[i].address,
                              ),
                              0,
                          );
                      }
                  }
              });

              it("only allows the owner to withdraw", async function () {
                  console.log("start only allows the owner to withdraw test");
                  const accounts = await ethers.getSigners();
                  const attacker = accounts[0];
                  console.log(attacker.address);
                  console.log(deployer);
                  const attackerConnectedContract =
                      await fundMe.connect(attacker);
                  console.log("attacker connected");
                  await expect(
                      attackerConnectedContract.withdraw(),
                  ).to.be.revertedWith("FundMe__NotOwner");
              });
          });

          describe("cheaperWithdraw", async function () {
              // 在账户中加点钱
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue });
              });

              it("allows us to cheaperWithdraw with mutiple funders", async function () {
                  console.log(
                      "start allows us to cheaperWithdraw with mutiple funders test",
                  );
                  const accounts = await ethers.getSigners();
                  // zero index is deployer, so start from one
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i],
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });

                      const startingFundMeBalance =
                          await ethers.provider.getBalance(fundMe.target);
                      console.log(
                          `startingFundMeBalance == ${startingFundMeBalance}`,
                      );
                      const startingDeployerBalance =
                          await ethers.provider.getBalance(deployer);
                      console.log(
                          `startingDeployerBalance == ${startingDeployerBalance}`,
                      );

                      const transactionResponse =
                          await fundMe.cheaperWithdraw();
                      const transactionReceipt =
                          await transactionResponse.wait(1);
                      const { gasPrice, gasUsed } = transactionReceipt;
                      const gasCost = gasPrice * gasUsed;
                      console.log(`gasCost == ${gasCost}`);
                      const endingFundMeBalance =
                          await ethers.provider.getBalance(fundMe.target);
                      console.log(
                          `endingFundMeBalance == ${endingFundMeBalance}`,
                      );
                      const endingDeployerBalance =
                          await ethers.provider.getBalance(deployer);
                      console.log(
                          `endingDeployerBalance == ${endingDeployerBalance}`,
                      );

                      assert.equal(endingFundMeBalance, 0);
                      assert.equal(
                          (
                              startingFundMeBalance + startingDeployerBalance
                          ).toString(),
                          (endingDeployerBalance + gasCost).toString(),
                      );

                      // make sure that the funders are reset properly
                      await expect(fundMe.getFunder(0)).to.be.reverted;

                      for (i = 1; i < 6; i++) {
                          assert.equal(
                              await fundMe.getAddressToAmountFunded(
                                  accounts[i].address,
                              ),
                              0,
                          );
                      }
                  }
              });
          });
      });

const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const chainId = network.config.chainId

chainId != "31337"
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe, mockV3Aggregator, deployer
          const sendValue = ethers.utils.parseEther("1")
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", function () {
              it("sets the aggregator address correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          describe("fund", function () {
              it("reverts if not enough ETH is sent", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Didn't send enough ETH"
                  )
              })

              it("updates the funders array", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunder(0)
                  assert.equal(funder, deployer)
              })

              it("updates the address to amount data structure", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmount(deployer)
                  assert.equal(response.toString(), sendValue.toString())
              })
          })

          describe("withdraw", function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })

              it("withdraws ETH when there exists a single funder", async function () {
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  const { effectiveGasPrice, gasUsed } = transactionReceipt
                  const gasCost = effectiveGasPrice.mul(gasUsed)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  assert.equal(endingFundMeBalance.toString(), 0)
                  assert.equal(
                      endingDeployerBalance.add(gasCost).toString(),
                      startingDeployerBalance.add(
                          startingFundMeBalance.toString()
                      )
                  )
              })

              it("withdraws ETH when there exist multiple funders", async function () {
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const connectedFunderAccount = await fundMe.connect(
                          accounts[i]
                      )
                      await connectedFunderAccount.fund({ value: sendValue })
                  }

                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  const { effectiveGasPrice, gasUsed } = transactionReceipt
                  const gasCost = effectiveGasPrice.mul(gasUsed)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  assert.equal(endingFundMeBalance.toString(), 0)
                  assert.equal(
                      endingDeployerBalance.add(gasCost).toString(),
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString()
                  )
                  expect(fundMe.getFunder(0)).to.be.reverted

                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmount(accounts[i].address),
                          0
                      )
                  }
              })

              it("only allows the owner to withdraw balance", async function () {
                  const accounts = await ethers.getSigners()
                  const attackerConnectedContract = await fundMe.connect(
                      accounts[1]
                  )

                  expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWith("FundMe__NotOwner")
              })

              it("cheaper withdraw testing...", async function () {
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const connectedFunderAccount = await fundMe.connect(
                          accounts[i]
                      )
                      await connectedFunderAccount.fund({ value: sendValue })
                  }

                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  const { effectiveGasPrice, gasUsed } = transactionReceipt
                  const gasCost = effectiveGasPrice.mul(gasUsed)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  assert.equal(endingFundMeBalance.toString(), 0)
                  assert.equal(
                      endingDeployerBalance.add(gasCost).toString(),
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString()
                  )
                  expect(fundMe.getFunder(0)).to.be.reverted

                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmount(accounts[i].address),
                          0
                      )
                  }
              })
          })
      })

//effectiveGasPrice, gasUsed

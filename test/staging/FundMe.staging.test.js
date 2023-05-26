const { assert } = require("chai")
const { ethers, getNamedAccounts, network } = require("hardhat")
const chainId = network.config.chainId
chainId == "31337"
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe, deployer
          const sendValue = ethers.utils.parseEther("1")

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract("FundMe", deployer)
          })

          it("allows funders to send and withdraw ETH", async function () {
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw()
              const endngBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )
              assert.equal(endngBalance.toString(), "0")
          })
      })

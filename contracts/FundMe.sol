// SPDX-License-Identifier: MIT
//pragma
pragma solidity ^0.8.8 .0;
//imports
import "./PriceConverter.sol";
//error codes
error FundMe__NotOwner();

//Interfaces and libraries

//Contarcts
/// @title A contract for crowd funding
/// @author Sushobhan Pathare
/// @notice This contract demos a sample funding contract
/// @dev This implements Pricefeeds as our library and also AggregatorV3Interface
contract FundMe {
    //Type declarations
    using PriceConverter for uint256;

    //State variables
    uint256 public constant MINIMUM_USD = 50 * 1e18;
    address private immutable i_owner;

    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;

    AggregatorV3Interface private s_priceFeed;

    //Events
    //Modifiers
    modifier onlyOwner() {
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    //Functions
    //#constructor
    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    //#receive
    receive() external payable {
        fund();
    }

    //#fallback
    fallback() external payable {
        fund();
    }

    //#external
    //#public
    /// @notice This function funds this contract
    /// @dev Implements AggregatorV3Interface and a self created library

    function fund() public payable {
        require(
            msg.value.getConversionRate(s_priceFeed) > MINIMUM_USD,
            "Didn't send enough ETH"
        );
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] += msg.value;
    }

    function withdraw() public payable onlyOwner {
        for (uint256 i = 0; i < s_funders.length; i++) {
            address funder = s_funders[i];
            s_addressToAmountFunded[funder] = 0;
        }

        s_funders = new address[](0);

        (bool isSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(isSuccess, "Transfer Failed!!!");
    }

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders;

        for (uint256 i = 0; i < funders.length; i++) {
            address funder = funders[i];
            s_addressToAmountFunded[funder] = 0;
        }

        s_funders = new address[](0);
        (bool isSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(isSuccess);
    }

    //#internal
    //#private
    //#view/pure

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmount(address funder) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}

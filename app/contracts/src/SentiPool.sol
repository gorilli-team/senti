// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";

contract SentiPool is Ownable, ERC20 {
    IERC20 public immutable i_tokenA;
    IERC20 public immutable i_tokenB;

    uint256 public constant BASIS_POINTS = 1e4;

    uint256 public s_totalLiquidityTokenA;
    uint256 public s_totalLiquidityTokenB;

    mapping (address user => uint256 amountTokenA) public s_liquidityTokenAPerUser;
    mapping (address user => uint256 amountTokenB) public s_liquidityTokenBPerUser;

    event Initialized(address initializer, uint256 indexed amountTokenA, uint256 amountTokenB);
    event TokenAtoTokenBSwap(address indexed user, uint256 indexed amountTokenA, uint256 indexed outputTokenB);
    event TokenBtoTokenASwap(address indexed user, uint256 indexed amountTokenB, uint256 indexed outputTokenA);
    event AddLiquidity(address indexed liquidityProvider, uint256 indexed amountTokenA, uint256 indexed amountTokenB);
    event RemoveLiquidity(address indexed liquidityProvider, uint256 indexed amountLPTokensBurned, uint256 indexed amountTokenA, uint256 amountTokenB);

    error SentiPool__AlreadyInitialized();
    error SentiPool__AmountMustBeGreaterThanZero();

    constructor(address _tokenA, address _tokenB, string memory lpTokenName, string memory lpTokenSymbol) Ownable(msg.sender)  ERC20(lpTokenName, lpTokenSymbol) {
        i_tokenA = IERC20(_tokenA);
        i_tokenB = IERC20(_tokenB);
    }

        function init(uint256 amountTokenA, uint256 amountTokenB) external onlyOwner {
        if (amountTokenA == 0 || amountTokenB == 0) {
            revert SentiPool__AmountMustBeGreaterThanZero();
        }

        if (s_totalLiquidityTokenA != 0 && s_totalLiquidityTokenB != 0) {
            revert SentiPool__AlreadyInitialized();
        }

        s_totalLiquidityTokenA = amountTokenA;
        s_totalLiquidityTokenB = amountTokenB;

        s_liquidityTokenAPerUser[msg.sender] = amountTokenA;
        s_liquidityTokenBPerUser[msg.sender] = amountTokenB;

        i_tokenA.transferFrom(msg.sender, address(this), amountTokenA);
        i_tokenB.transferFrom(msg.sender, address(this), amountTokenB);
        _mint(msg.sender, _calculateLPTokensInit(amountTokenA, amountTokenB));

        emit Initialized(msg.sender, amountTokenA, amountTokenB);
    }

    function tokenAtoTokenB(uint256 amountTokenA) external returns(uint256 outputTokenB) {
        if (amountTokenA == 0) {
            revert SentiPool__AmountMustBeGreaterThanZero();
        }
        uint256 reservesTokenA = s_totalLiquidityTokenA;
        uint256 reservesTokenB = s_totalLiquidityTokenB;

        outputTokenB = price(amountTokenA, reservesTokenA, reservesTokenB);
        s_totalLiquidityTokenA += amountTokenA;
        s_totalLiquidityTokenB -= outputTokenB;

        i_tokenA.transferFrom(msg.sender, address(this), amountTokenA);
        i_tokenB.transfer(msg.sender, outputTokenB);

        emit TokenAtoTokenBSwap(msg.sender, amountTokenA, outputTokenB);
        return outputTokenB;
    }

    function tokenBtoTokenA(uint256 amountTokenB) external returns(uint256 outputTokenA) {
        if (amountTokenB == 0) {
            revert SentiPool__AmountMustBeGreaterThanZero();
        }
        uint256 reservesTokenA = s_totalLiquidityTokenA;
        uint256 reservesTokenB = s_totalLiquidityTokenB;

        outputTokenA = price(amountTokenB, reservesTokenB, reservesTokenA);
        s_totalLiquidityTokenB += amountTokenB;
        s_totalLiquidityTokenA -= outputTokenA;

        i_tokenB.transferFrom(msg.sender, address(this), amountTokenB);
        i_tokenA.transfer(msg.sender, outputTokenA);

        emit TokenBtoTokenASwap(msg.sender, amountTokenB, outputTokenA);
        return outputTokenA;
    }

    function addLiquidityTokenA(uint256 amountTokenA) external returns(uint256 amountTokenB) {
        if (amountTokenA == 0) {
            revert SentiPool__AmountMustBeGreaterThanZero();
        }
        uint256 reservesTokenA = s_totalLiquidityTokenA;
        uint256 reservesTokenB = s_totalLiquidityTokenB;
        uint256 lpTokensToMint = _calculateLPTokensAddLiquidity(amountTokenA, reservesTokenA);

        amountTokenB = (amountTokenA * reservesTokenB) / reservesTokenA;

        s_totalLiquidityTokenA += amountTokenA;
        s_totalLiquidityTokenB += amountTokenB;
        s_liquidityTokenAPerUser[msg.sender] += amountTokenA;
        s_liquidityTokenBPerUser[msg.sender] += amountTokenB;

        i_tokenA.transferFrom(msg.sender, address(this), amountTokenA);
        i_tokenB.transferFrom(msg.sender, address(this), amountTokenB);
        _mint(msg.sender, lpTokensToMint);

        emit AddLiquidity(msg.sender, amountTokenA, amountTokenB);
    }

    function addLiquidityTokenB(uint256 amountTokenB) external returns(uint256 amountTokenA) {
        if (amountTokenB == 0) {
            revert SentiPool__AmountMustBeGreaterThanZero();
        }
        uint256 reservesTokenA = s_totalLiquidityTokenA;
        uint256 reservesTokenB = s_totalLiquidityTokenB;
        uint256 lpTokensToMint = _calculateLPTokensAddLiquidity(amountTokenB, reservesTokenB);

        amountTokenA = (amountTokenB * reservesTokenA) / reservesTokenB;

        s_totalLiquidityTokenA += amountTokenA;
        s_totalLiquidityTokenB += amountTokenB;
        s_liquidityTokenAPerUser[msg.sender] += amountTokenA;
        s_liquidityTokenBPerUser[msg.sender] += amountTokenB;

        i_tokenA.transferFrom(msg.sender, address(this), amountTokenA);
        i_tokenB.transferFrom(msg.sender, address(this), amountTokenB);
        _mint(msg.sender, lpTokensToMint);

        emit AddLiquidity(msg.sender, amountTokenA, amountTokenB);
    }

    function removeLiquidity(uint256 amountLPTokens) external {
        if (amountLPTokens == 0) {
            revert SentiPool__AmountMustBeGreaterThanZero();
        }
        uint256 poolShare = _calculatePoolShare(amountLPTokens);
        uint256 amountTokenAToSend = (poolShare * s_totalLiquidityTokenA) / BASIS_POINTS;
        uint256 amountTokenBToSend = (poolShare * s_totalLiquidityTokenB) / BASIS_POINTS;
        
        s_totalLiquidityTokenA -= amountTokenAToSend;
        s_totalLiquidityTokenB -= amountTokenBToSend;
        s_liquidityTokenAPerUser[msg.sender] -= amountTokenAToSend;
        s_liquidityTokenBPerUser[msg.sender] -= amountTokenBToSend;

        i_tokenA.transfer(msg.sender, amountTokenAToSend);
        i_tokenB.transfer(msg.sender, amountTokenBToSend);
        _burn(msg.sender, amountLPTokens);

        emit RemoveLiquidity(msg.sender, amountLPTokens, amountTokenAToSend, amountTokenBToSend);
    }

    function price(uint256 xInput, uint256 xReserves, uint256 yReserves) public pure returns(uint256 yOutput) {
        uint256 xInputWithFee = xInput * 997;
        uint256 numerator = xInputWithFee * yReserves;
        uint256 denominator = (xReserves * 1000) + xInputWithFee;
        return (numerator / denominator);
    }

    function _calculateLPTokensInit(uint256 amountTokenA, uint256 amountTokenB) internal pure returns(uint256 amountLPTokens) {
        return Math.sqrt(amountTokenA) * Math.sqrt(amountTokenB);
    }

    function _calculateLPTokensAddLiquidity(uint256 amountInputToken, uint256 reservesInputToken) internal view returns(uint256 amountLPTokens) {
        return (((amountInputToken * BASIS_POINTS) / reservesInputToken) * totalSupply()) / BASIS_POINTS;
    }

    function _calculatePoolShare(uint256 amountLPTokens) internal view returns(uint256) {
        return (amountLPTokens * BASIS_POINTS) / totalSupply();
    }

    function getTotalLiquidityTokenA() external view returns(uint256) {
        return s_totalLiquidityTokenA;
    }

    function getTotalLiquidityTokenB() external view returns(uint256) {
        return s_totalLiquidityTokenB;
    }

    function getLiquidityTokenAPerUser(address user) external view returns(uint256) {
        return s_liquidityTokenAPerUser[user];
    }

    function getLiquidityTokenBPerUser(address user) external view returns(uint256) {
        return s_liquidityTokenBPerUser[user];
    }

    function getLPTokensInit(uint256 amountTokenA, uint256 amountTokenB) external pure returns(uint256) {
        return _calculateLPTokensInit(amountTokenA, amountTokenB);
    }

    function getLPTokensAddLiquidity(uint256 amountTokenA, uint256 reservesTokenA) external view returns(uint256) {
        return _calculateLPTokensAddLiquidity(amountTokenA, reservesTokenA);
    }

    function getPoolShare(uint256 amountLPTokens) external view returns(uint256) {
        return _calculatePoolShare(amountLPTokens);
    }
}
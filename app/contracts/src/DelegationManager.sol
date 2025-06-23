// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DelegationManager is Ownable {
    event Deposited(address indexed user, address indexed token, uint256 amount);
    event Claimed(address indexed user, address indexed token, uint256 amount);
    event AllowedOperatorUpdated(address indexed oldOperator, address indexed newOperator);

    error DelegationManager__DepositFailed();
    error DelegationManager__InvalidTokenAddress();
    error DelegationManager__InvalidAmount();
    error DelegationManager__InvalidOperator();

    address s_allowedOperator;
    mapping(address user => mapping(address token => uint256 amount)) public s_delegatedBalances;

    constructor(address _allowedOperator) Ownable(msg.sender) {
        s_allowedOperator = _allowedOperator;
    }

    function depositToAllowedOperator(address _token, uint256 amount) public {
        if (_token == address(0)) {
            revert DelegationManager__InvalidTokenAddress();
        }
        if (amount <= 0) {
            revert DelegationManager__InvalidAmount();
        }
        IERC20 token = IERC20(_token);
        s_delegatedBalances[msg.sender][address(token)] += amount;

        bool success = token.transferFrom(msg.sender, s_allowedOperator, amount);
        if (!success) {
            revert DelegationManager__DepositFailed();
        }

        emit Deposited(msg.sender, address(token), amount);
    }

    function claimFromAllowedOperator(address _token, uint256 amount) public {
        if (_token == address(0)) {
            revert DelegationManager__InvalidTokenAddress();
        }
        uint256 balance = s_delegatedBalances[msg.sender][_token];
        if (balance < amount) {
            revert DelegationManager__InvalidAmount();
        }
        if (amount <= 0) {
            revert DelegationManager__InvalidAmount();
        }
        IERC20 token = IERC20(_token);
        s_delegatedBalances[msg.sender][address(token)] -= amount;

        bool success = token.transferFrom(s_allowedOperator, msg.sender, amount);
        if (!success) {
            revert DelegationManager__DepositFailed();
        }

        emit Claimed(msg.sender, address(token), amount);
    }

    function setAllowedOperator(address _newAllowedOperator) public onlyOwner {
        if (_newAllowedOperator == address(0)) {
            revert DelegationManager__InvalidOperator();
        }

        address oldOperator = s_allowedOperator;
        s_allowedOperator = _newAllowedOperator;

        emit AllowedOperatorUpdated(oldOperator, _newAllowedOperator);
    }
}
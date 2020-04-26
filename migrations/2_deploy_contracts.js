
const Voting = artifacts.require("Voting");

module.exports = function(deployer) {
  // 
  deployer.deploy(Voting, ["zhangsan", "lisi", "wangwu"].map(item => web3.utils.toHex(item)),1000,web3.utils.toWei("1"));
};

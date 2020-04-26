
pragma solidity ^0.4.26;

contract Voting{
    
    uint public totalToken;    // 发行总量
    uint public nowToken;      // 剩余未购买的token
    uint public priceToken;    // 多少以太(wei)兑换一枚Token
    
    bytes32[] public candidates;    // 候选人集合
    mapping(bytes32 => uint) candidateInfo;  // 候选人票数情况
    
    mapping(address => voter) voterInfo; // 投票人信息
    
    // 投票人结构体
    struct voter{
        address vote;   // 投票人地址
        uint balance;   // token余额
        mapping(bytes32 => uint) votesCandidate;  // 投票情况(给谁投票，投了多少)
    }
    
    // 初始化合约，定义候选人，发行总量，兑换比例
    constructor(bytes32[] list,uint total,uint price) public {
        candidates = list;
        totalToken = nowToken = total;
        priceToken = price;
    }
    
    // 购买token
    function buyToken(uint num)public payable {
        // 购买几个token
        uint money = num * priceToken;
        //判断 msg.value == money 为了防止修改汇率
        require(msg.sender.balance >= money && msg.value == money,"余额不足 || 汇率错误");
        
        
        // 获取投票人对象(引用类型，这里传的是指针)
        voter storage newVote = voterInfo[msg.sender];
        // 设置address
        newVote.vote = msg.sender;
        // 设置token余额
        newVote.balance += num;
        
        // 更新未被购买的token数量
        nowToken -= num;
        // 向合约账户转账
        //address(this).transfer(money);
    }
    
    // 获取合约余额
    function getContractBalance()public view returns(uint){
        return address(this).balance;
    }

    // 向合约转账的回调函数
    //function()payable public{}
    
    // 投票
    function voting(bytes32 name ,uint number)public {
        require(voterInfo[msg.sender].balance >= number,"您的余额token不足");
        require(confirmName(name),"请输入正确的候选人名单");
        // 记录对某个选举人的投票情况
        voterInfo[msg.sender].votesCandidate[name] += number;
        // 更新余额
        voterInfo[msg.sender].balance -= number;
        // 更新选举人获得的票数
        candidateInfo[name] += number;
        
    }
    
    // 验证当前名字，是否存在候选人中！
    function confirmName(bytes32 name)public view returns(bool){
        for(uint i = 0 ; i < candidates.length ; i++){
            if(name == candidates[i]){
                return true;
            }
        }
        return false;
    }
    
    
    // 获取某个人获得的票数
    function getVotes(bytes32 name)public view returns(uint){
        return candidateInfo[name];
    }
    
    // 获取投票人的token余额
    function getTokenBalance(address addr)public view returns(uint){
        return voterInfo[addr].balance;
    }
    // 获取当前地址余额
    function getBalance(address addr)public view returns(uint){
        return addr.balance;
    }

    // 获取投票人总购买的token数额
    function getTotal(address addr)public view returns(uint){
        // 初始化总额等于余额
        uint total = voterInfo[addr].balance;
        for(uint i = 0 ; i < candidates.length ; i++){
            // 获取当前用户给每个候选人的投票数
            total += voterInfo[addr].votesCandidate[candidates[i]];
        }
        return total;
        
    }
    
    // 获取当前用户对某个候选人的投票数额
    function getCurrentVotes(address addr , bytes32 name)public view returns(uint){
        return voterInfo[addr].votesCandidate[name];
    }
   
    
}
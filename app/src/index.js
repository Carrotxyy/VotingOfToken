import { default as Web3} from "web3";
import {default as  contract } from 'truffle-contract'
import VotingData from "../../build/contracts/Voting.json";

// 定义候选人名单
const candidates = {
  zhangsan : "candidate-1",
  lisi : "candidate-2",
  wangwu : "candidate-3",
}

const App = {
  web3 : null,
  instance : null,
  totalToken : 0,
  nowToken : 0,
  priceToken : 0,
  start : async function(){
    const web3 = this.web3
    try {
      
      const Voting = contract(VotingData)
      //获取的是客户端metamask或者是geth
      Voting.setProvider( web3.currentProvider )
      // 加载合约
      this.instance = await Voting.deployed()

      console.log("合约",this.instance)
      // 调用加载数据
      this.loadData()     
      
      // 启动事件监听
      this.event() 
    } catch (error) {
      console.error(" Could not connect to contract or chain. ",error)
    }
  },
  loadData : async function(){
    const instance = this.instance
    // 获取总发行量
    var totalToken = await instance.totalToken()
    this.totalToken = totalToken.toString(10)
    // 获取剩余量
    var nowToken = await instance.nowToken()
    this.nowToken = nowToken.toString(10)
    // 获取兑换价格(wei)
    var priceToken = await instance.priceToken()
    // 将价钱单位转换成eth
    this.priceToken = priceToken.toString(10)
    // 渲染
    this.rendering()
  },
  rendering : async function(){

    console.log("11111:",this.totalToken,this.nowToken,this.priceToken)

    $("#totalToken").html(this.totalToken)
    $("#nowToken").html(this.nowToken)
    $("#priceToken").html(this.web3.utils.fromWei(this.priceToken)  + " eth")
    $("#soldTotal").html(this.totalToken - this.nowToken )

    // 获取选举人列表
    var keys = Object.keys(candidates)

    for (var name of keys){
      // 获取当事人票数（一定要将string类型转成byte）
      var num = await this.instance.getVotes(this.web3.utils.toHex(name))
      $(`#${candidates[name]}`).html(num.toString(10))
    }

  },
  // 事假
  event : async function(){
    this.buyToken()
    this.voting()
    this.search()
  },
  // 购买token
  buyToken : async function(){
    
    // 获取所有用户对象
    const accounts = await this.web3.eth.getAccounts()
    // 箭头函数解决了回调函数的this指向问题
    $("#buyToken").on("click",async ()=>{
      // 获取购买量
      var tokenNumber = $("#tokenNumber").val()
      // 计算所需要的金额
      var money = Number(tokenNumber) * Number(this.priceToken)
      // 获取用户的余额
      var balance = await this.instance.getBalance(accounts[1])

      console.log(`余额:${balance} 所需资金:${money}`)
      if(money > balance){
        layer.msg("你的余额不够！")
        return;
      }

      // 构建交易体
      const tx = {from : accounts[1],value:Number(tokenNumber) * Number(this.priceToken)}
      // 购买token
      this.instance.buyToken(Number(tokenNumber),tx).then(()=>{
        layer.msg(`成功购买 ${tokenNumber}个token`)
      },(err)=>{
        layer.msg("购买失败")
        console.log(err)
      })

      // 由于数据发生改变，要将不准确的信息隐藏
      $("#panel").hide("solw")
      // 重新加载数据，渲染
      this.loadData()
    })
  },
  // 投票
  voting : async function(){
    $("#confirmVote").on("click",async()=>{
        
      // 获取所有用户对象
      const accounts = await this.web3.eth.getAccounts()
      console.log(accounts[1])
      var candidateName = $("#candidateName").val()
      var voteNumber = Number($("#voteNumber").val())
      if(voteNumber <= 0 || window.isNaN(voteNumber)){
        layer.msg("请正确输入票数")
        return
      }
      var tx = {from:accounts[1]}
      // 投票
      this.instance.voting(this.web3.utils.toHex(candidateName),voteNumber,tx).then(()=>{
        layer.msg(`感谢你为${candidateName}投了${voteNumber}票`)
      },(err)=>{
        layer.msg("非常抱歉投票失败.可能是你的token余额不足")
        console.log("投票",err)
      })

      // 由于数据发生改变，要将不准确的信息隐藏
      $("#panel").hide("solw")
      // 重新加载数据，渲染
      this.loadData()
    })
  },
  // 查询信息
  search : async function(){
    $("#searchVote").on("click",async ()=>{
      // 获取要查询的地址
      const addr = $("#candidateAddr").val()
      // 获取购买token的总量
      const total = await this.instance.getTotal(addr)
      // 获取剩余token
      const balanceToken = await this.instance.getTokenBalance(addr)

      $("#userTotalToken").html(total.toString(10))
      $("#balanceToken").html(balanceToken.toString(10))

      // 先将内容清除
      $("#displayArea").html("")
      for (var name of Object.keys(candidates) ){
        // 获取票数
        var number = await this.instance.getCurrentVotes(addr,this.web3.utils.toHex(name) )
        $("#displayArea").append(`
          <tr>
            <td>${name}</td>
            <td>${number}</td>
          </tr>
        `)
      }

      // 显示信息
      $("#panel").show("slow")

    })
  }

}



window.App = App;


$(function(){
  // 连接本地geth( || ganache-cli)
  const provider = new Web3.providers.HttpProvider("http://127.0.0.1:8546")
  App.web3 = new Web3(provider)
  // 投票人信息隐藏
  $("#panel").hide()
  App.start()
})


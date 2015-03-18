var mongoose = require('mongoose');

var applySchema = mongoose.Schema({
    userID: {type:String, required:'{PATH} is required!'},
    serialID: {type:String, unique: true, required:'{PATH} is required!'},
    amount: {type:Number, required:'{PATH} is required!'},
    deposit: {type:Number, required:'{PATH} is required!'},
    period: {type:Number, required:'{PATH} is required!'},
    status: {type:Number, required:'{PATH} is required!', default: 1}, // 1 means 待支付, 2 means 操盘, 3 means 已结算, 4 means 审核中, 5 means 结算中
    applyAt: {type:Date, default: Date.now()},
    isTrial: {type:Boolean, default: false},
    startTime: Date,
    endTime: Date,
    account: String,
    password: String,
    profit: Number,
    orderID: String
});

var Apply = mongoose.model('Apply', applySchema);

module.exports = Apply;

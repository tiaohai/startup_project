(function() {
    var holiday = [
        moment("2015-03-14").dayOfYear(),
        moment("2015-03-15").dayOfYear(),
        moment("2015-03-21").dayOfYear(),
        moment("2015-03-22").dayOfYear(),
        moment("2015-03-28").dayOfYear(),
        moment("2015-03-29").dayOfYear(),
        moment("2015-04-04").dayOfYear(),
        moment("2015-04-05").dayOfYear(),
        moment("2015-04-06").dayOfYear(),
        moment("2015-04-11").dayOfYear(),
        moment("2015-04-12").dayOfYear(),
        moment("2015-04-18").dayOfYear(),
        moment("2015-04-19").dayOfYear(),
        moment("2015-04-25").dayOfYear(),
        moment("2015-04-26").dayOfYear(),
        moment("2015-05-01").dayOfYear(),
        moment("2015-05-02").dayOfYear(),
        moment("2015-05-03").dayOfYear(),
        moment("2015-05-09").dayOfYear(),
        moment("2015-05-10").dayOfYear(),
        moment("2015-05-16").dayOfYear(),
        moment("2015-05-17").dayOfYear(),
        moment("2015-05-23").dayOfYear(),
        moment("2015-05-24").dayOfYear(),
        moment("2015-06-06").dayOfYear(),
        moment("2015-06-07").dayOfYear(),
        moment("2015-06-13").dayOfYear(),
        moment("2015-06-14").dayOfYear(),
        moment("2015-06-20").dayOfYear(),
        moment("2015-06-21").dayOfYear(),
        moment("2015-06-22").dayOfYear(),
        moment("2015-06-27").dayOfYear(),
        moment("2015-06-28").dayOfYear(),
        moment("2015-07-04").dayOfYear(),
        moment("2015-07-05").dayOfYear(),
        moment("2015-07-11").dayOfYear(),
        moment("2015-07-12").dayOfYear(),
        moment("2015-07-18").dayOfYear(),
        moment("2015-07-19").dayOfYear(),
        moment("2015-07-25").dayOfYear(),
        moment("2015-07-26").dayOfYear(),
        moment("2015-08-01").dayOfYear(),
        moment("2015-08-02").dayOfYear(),
        moment("2015-08-08").dayOfYear(),
        moment("2015-08-09").dayOfYear(),
        moment("2015-08-15").dayOfYear(),
        moment("2015-08-16").dayOfYear(),
        moment("2015-08-22").dayOfYear(),
        moment("2015-08-23").dayOfYear(),
        moment("2015-08-29").dayOfYear(),
        moment("2015-08-30").dayOfYear(),
        moment("2015-09-05").dayOfYear(),
        moment("2015-09-06").dayOfYear(),
        moment("2015-09-12").dayOfYear(),
        moment("2015-09-13").dayOfYear(),
        moment("2015-09-19").dayOfYear(),
        moment("2015-09-20").dayOfYear(),
        moment("2015-09-26").dayOfYear(),
        moment("2015-09-27").dayOfYear(),
        moment("2015-10-01").dayOfYear(),
        moment("2015-10-02").dayOfYear(),
        moment("2015-10-03").dayOfYear(),
        moment("2015-10-04").dayOfYear(),
        moment("2015-10-05").dayOfYear(),
        moment("2015-10-06").dayOfYear(),
        moment("2015-10-07").dayOfYear(),
        moment("2015-10-10").dayOfYear(),
        moment("2015-10-11").dayOfYear(),
        moment("2015-10-17").dayOfYear(),
        moment("2015-10-18").dayOfYear(),
        moment("2015-10-24").dayOfYear(),
        moment("2015-10-25").dayOfYear(),
        moment("2015-10-31").dayOfYear(),
        moment("2015-11-01").dayOfYear(),
        moment("2015-11-07").dayOfYear(),
        moment("2015-11-08").dayOfYear(),
        moment("2015-11-14").dayOfYear(),
        moment("2015-11-15").dayOfYear(),
        moment("2015-11-21").dayOfYear(),
        moment("2015-11-22").dayOfYear(),
        moment("2015-11-28").dayOfYear(),
        moment("2015-11-29").dayOfYear(),
        moment("2015-12-05").dayOfYear(),
        moment("2015-12-06").dayOfYear(),
        moment("2015-12-12").dayOfYear(),
        moment("2015-12-13").dayOfYear(),
        moment("2015-12-19").dayOfYear(),
        moment("2015-12-20").dayOfYear(),
        moment("2015-12-26").dayOfYear(),
        moment("2015-12-27").dayOfYear()
    ];

    var getStartDay = function() {
        var startDay = moment().startOf('day');
        if (moment().hour() > 14 || (moment().hour() == 14 && moment().minute() >= 30)) {
            startDay = moment().endOf('day').add(1, 'ms');
        }

        while (true) {
            var dayOfYear = startDay.dayOfYear();
            if (holiday.indexOf(dayOfYear) === -1) {
                break;
            }
            startDay = startDay.add(1, 'day');
        }
        return startDay;
    };

    var getEndDay = function(startDay, days) {
        --days;
        var endDay = startDay.clone();
        while (days) {
            endDay = endDay.add(1, 'day');
            if (holiday.indexOf(endDay.dayOfYear()) !== -1) continue;
            --days;
        }
        endDay.hour(14);
        endDay.minute(54);
        endDay.second(59);
        return endDay;
    };

    var tradeDaysFromEndDay = function(endDay, days) {
        var dayOfYear = moment(endDay).dayOfYear();
        var ret = 0;
        --days;
        while (days) {
            if (holiday.indexOf(dayOfYear) === -1) {
                --days;
            }
            --dayOfYear;
            ++ret;
        }
        return ret;
    };

    angular.module('commonApp', []);

    angular.module('commonApp').value('gbToastr', toastr);

    angular.module('commonApp').factory('gbNotifier', ['gbToastr', function(gbToastr) {
        return {
            notify: function(msg) {
                gbToastr.success(msg);
                //console.log(msg);
            },
            error: function(msg) {
                gbToastr.error(msg);
                //console.log(msg);
            }
        }
    }]);

    angular.module('commonApp').filter("numTrunc", function () {
        return function (input) {
            var ret = input;
            if (angular.isNumber(ret)) {
                ret = ret.toFixed(2);
                ret = ret.substr(-3);
            }
            return ret;
        };
    }).filter("displayOrderAmount", function () {
        return function (input, orderType) {
            var ret = '';
            if (orderType === 2) {
                ret = '-';
            }
            return ret + input;
        };
    }).filter("displayMobile", function () {
        return function (input) {
            if (input) {
                input = input.toString();
                return input.substr(0, 3) + "****" + input.substr(-4);
            }
            return '';
        };
    }).filter("displayEmail", function () {
        return function (input) {
            if (input) {
                var pos = input.search('@');
                return input.substr(0, 2) + "***" + input.substr(pos);
            } else {
                return '';
            }
        };
    }).filter("displayIdentityID", function () {
        return function (input) {
            if (input) {
                return input.substr(0, 4) + "**********" + input.substr(-4);
            } else {
                return '';
            }
        };
    }).filter("displayDate", function () {
        return function (input) {
            return moment(input).format("YYYY-MM-DD HH:mm");
        };
    }).filter("displayCard", ['BankNameList', function (BankNameList) {
        return function (input) {
            var lastNumStr = input.cardID.toString().substr(12);
            return BankNameList[input.bankID].name + ' **** **** **** ' + lastNumStr;
        };
    }]).filter("orderStatus", function() {
        return function (input) {
            switch (input) {
                case 0:
                    return '等待确认';
                case 1:
                    return '交易成功';
                case 2:
                    return '未支付';
                default:
                    return '未支付';
            }
        };
    }).filter("displayOrderType", function() {
        return function (input) {
            switch (input) {
                case 1:
                    return '充值';
                case 2:
                    return '提现';
                case 3:
                    return '盈利提取';
                case 4:
                    return '股票盈利';
                case 5:
                    return '保证金返还';
                case 6:
                    return '追加配资保证金';
                case 7:
                    return '配资延期';
                case 8:
                    return '管理费返还';
                default:
                    return '充值';
            }
        };
    }).filter("applyStatus", function() {
        return function(input) {
            switch (input) {
                case 1:
                    return "待支付";
                case 2:
                    return "操盘中";
                case 3:
                    return "已结算";
                case 4:
                    return "审核中";
                case 5:
                    return "结算中";
                default:
                    return "待支付";
            }
        };
    }).service("days", function () {
        this.startTime = getStartDay;
        this.endTime = getEndDay;
        this.tradeDaysFromEndDay = tradeDaysFromEndDay;
    });

    angular.module('commonApp').constant('withdraw_sms_content', '您于TIME在牛金网提现AMOUNT元，提现已完成，请注意查收，')
        .constant('get_profit_sms_content', '您的盈利提取申请已经处理，资金已划入您在牛金网的余额')
        .constant('approve_apply_sms_content', '您有一笔金额为AMOUNT元配资资金已到账，交易账号ACCOUNT，登录密码PASSWORD，您可以通过手机或电脑进行操盘，可以登录牛金网，在我的账户中查看相应账户信息，操盘账户是您操盘的唯一依据，请不要向任何人泄露！')
        .constant('close_apply_sms_content', '您在牛金网有一笔TOTAL_AMOUNT元的配资业务已经结算完毕，根据您的操盘收益，该笔配资实际结算AMOUNT元（保证金DEPOSIT元，收益PROFIT元），祝您投资愉快。')
        .constant('pay_success_sms_content', '您于TIME在牛金网充值AMOUNT元，资金已经到账，感谢您对牛金网的支持，祝您投资愉快。')
        .constant('warn_sms_content', '您有一笔金额为TOTAL_AMOUNT元的操盘业务已经亏损到达警戒线WARN_AMOUNT元，请尽快追加保证金以维持仓位，您可以登录牛金网进行操作，或者联系QQ客服400 692 1388或电话客服400 692 1388。感谢您对牛金网的支持，祝您投资愉快。')
        .constant('sell_sms_content', '您有一笔金额为TOTAL_AMOUNT元的操盘业务已经亏损到达平仓线SELL_AMOUNT元，系统已经将交易账户平仓，请登录牛金网查看相应信息，或者联系QQ客服400 692 1388或电话客服400 692 1388。感谢您对牛金网的支持，祝您投资愉快。')
        .constant('service_charge', 19.9)
        .constant('warn_factor', 0.96)
        .constant('sell_factor', 0.94);

    angular.module('commonApp').constant('BankNameList', [
        {
            name: '工商银行',
            img: '/images/yh/icbc.png',
            instCode: 'ICBC',
            credit: true,
            value: 0
        },
        {
            name: '建设银行',
            img: '/images/yh/ccb.png',
            instCode: 'CCB',
            credit: true,
            value: 1
        },
        {
            name: '农业银行',
            img: '/images/yh/abc.png',
            instCode: 'ABC',
            credit: true,
            value: 2
        },
        {
            name: '中国银行',
            img: '/images/yh/boc.png',
            instCode: 'BOC',
            credit: true,
            value: 3
        },
        {
            name: '招商银行',
            img: '/images/yh/cmb.png',
            instCode: 'CMB',
            credit: true,
            value: 4
        },
        {
            name: '交通银行',
            img: '/images/yh/bcs.png',
            instCode: 'COMM',
            credit: true,
            value: 5
        },
        {
            name: '邮政储蓄银行',
            img: '/images/yh/psbc.png',
            instCode: 'PSBC',
            credit: false,
            value: 6
        },
        {
            name: '广发银行',
            img: '/images/yh/cgb.png',
            instCode: 'GDB',
            credit: true,
            value: 7
        },
        {
            name: '光大银行',
            img: '/images/yh/ceb.png',
            instCode: 'CEB',
            credit: true,
            value: 8
        },
        {
            name: '兴业银行',
            img: '/images/yh/cib.png',
            instCode: 'CIB',
            credit: true,
            value: 9
        },
        {
            name: '北京银行',
            img: '/images/yh/bob.png',
            instCode: 'BCCB',
            credit: false,
            value: 10
        },
        {
            name: '浦发银行',
            img: '/images/yh/spdb.png',
            instCode: 'SPDB',
            credit: true,
            value: 11
        },
        {
            name: '民生银行',
            img: '/images/yh/cmbc.png',
            instCode: 'CMBC',
            credit: true,
            value: 12
        },
        {
            name: '中信银行',
            img: '/images/yh/ecitic.png',
            instCode: 'CITIC',
            credit: true,
            value: 13
        },
        {
            name: '华夏银行',
            img: '/images/yh/hx-2.png',
            instCode: 'HXB',
            credit: false,
            value: 14
        },
        {
            name: '平安银行',
            img: '/images/yh/pa.png',
            instCode: 'SZPAB',
            credit: true,
            value: 15
        },
        /*
        {
            name: '杭州银行',
            img: '/images/yh/hzyh.png',
            value: 16
        },
        */
        {
            name: '宁波银行',
            img: '/images/yh/nbcb.png',
            instCode: 'NBCB',
            credit: false,
            value: 17
        },
        {
            name: '上海银行',
            img: '/images/yh/bos.png',
            instCode: 'BOS',
            credit: true,
            value: 18
        }
    ]);

    angular.module('commonApp').factory('njUser', ['$resource', function($resource) {
        var UserResource = $resource('/api/user/:id', {id: "@_id"});

        return UserResource;
    }]);

    angular.module('commonApp').factory('njApply', ['$resource', function($resource) {
        var ApplyResource = $resource('/api/user/:uid/applies/:serial_id', {uid: "@userID", serial_id: "@serialID"});

        return ApplyResource;
    }]);

    angular.module('commonApp').factory('njOrder', ['$resource', function($resource) {
        var OrderResource = $resource('/api/user/:uid/orders/:id', {uid: "@userID", id: "@_id"});

        return OrderResource;
    }]);

    angular.module('commonApp').factory('njCard', ['$resource', function($resource) {
        var CardResource = $resource('/api/cards/:uid', {userID: "@uid"});

        return CardResource;
    }]);

    angular.module('commonApp').factory('njCachedCards', ['njCard', function(njCard) {
        var cardList;
        var uid;

        return {
            setUID: function(id) {
                uid = id;
            },

            query: function() {
                if(!cardList) {
                    cardList = njCard.query({uid:uid});
                }
                return cardList;
            }
        }
    }]);
}());

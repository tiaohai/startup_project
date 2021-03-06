'use strict';
angular.module('mobileApp').controller('MobileRechargeCtrl', ['$scope', '$window', '$http', '$timeout', '$location', 'njOrder', function($scope, $window, $http, $timeout, $location, njOrder) {
    var vm = this;

    vm.user = $window.bootstrappedUserObject;
    if (!vm.user) {
        if (!$scope.data) {
            $scope.data = {}
        }
        $scope.data.lastLocation = '/user';
        $location.path('/login');
    } else {
        vm.smsSend = false;
        vm.inputError = false;
        vm.alipayConfirm = false;
        vm.orderCreateSuccess = false;
        vm.pay_order = $window.bootstrappedOrderObject;
        if (vm.pay_order) {
            if (vm.user.finance.balance > 0) {
                vm.pay_amount = Number((vm.pay_order.amount - vm.user.finance.balance).toFixed(2));
                if (vm.pay_amount < 0) {
                    vm.pay_amount = 0;
                }
            } else {
                vm.pay_amount = Number(vm.pay_order.amount.toFixed(2));
            }
        }
    }

    vm.sendSMSBankInfo = function() {
        if (vm.smsSend) {
            return;
        }
        vm.smsSend = true;
        $timeout(function() {
            vm.smsSend = false;
        }, 60000);
        var info = '户名：北京小牛普惠科技有限公司，账号：110912609510501，开户行：招商银行股份有限公司北京清华园支行';
        $http.post('/api/send_sms', {sms_content:info})
            .success(function(data, status, headers, config) {
                //addAlert('success', '短信发送成功');
                console.log('success');
            })
            .error(function(data, status, headers, config) {
                //addAlert('danger', '短信发送失败，请稍后重试');
                console.log('fail');
            });
    };

    vm.aliPay = function() {
        if (!vm.alipay_account) {
            vm.errorMsg = '请输入支付宝账户';
            vm.inputError = true;
            $timeout(function() {
                vm.inputError = false;
            }, 1500);
            return;
        }
        if (!vm.alipay_name) {
            vm.errorMsg = '请输入支付宝实名认证姓名';
            vm.inputError = true;
            $timeout(function() {
                vm.inputError = false;
            }, 1500);
            return;
        }
        if (!vm.pay_amount || vm.pay_amount < 0) {
            vm.errorMsg = '请输入有效的充值金额';
            vm.inputError = true;
            $timeout(function() {
                vm.inputError = false;
            }, 1500);
            return;
        }
        vm.alipayConfirm = true;

        var newOrder = new njOrder({uid:vm.user._id});
        if (vm.pay_order) {
            vm.pay_order.description += ' 支付宝转账(移动)';
            vm.pay_order.payType = 3;
            vm.pay_order.otherInfo = vm.alipay_account;
            vm.pay_order.transID = vm.alipay_name;
            $http.post('/api/user/' + vm.user._id + '/orders/' + vm.pay_order._id, vm.pay_order)
                .success(function(data, status) {
                })
                .error(function(data, status) {
                    console.log('order update failed');
                    vm.errorMsg = '服务暂时不可用，请稍后再试';
                    vm.inputError = true;
                    $timeout(function() {
                        vm.inputError = false;
                    }, 1500);
                });
        } else {
            newOrder.userID = vm.user._id;
            newOrder.userMobile = vm.user.mobile;
            newOrder.dealType = 1;
            newOrder.amount = Number(vm.pay_amount.toFixed(2));
            newOrder.description = '支付宝转账(移动)';
            newOrder.payType = 3;
            newOrder.status = 2;
            newOrder.otherInfo = vm.alipay_account;
            newOrder.transID = vm.alipay_name;
            newOrder.$save(function(o, responseHeaders) {
            }, function(response) {
                vm.errorMsg = '服务暂时不可用，请稍后再试';
                vm.inputError = true;
                $timeout(function() {
                    vm.inputError = false;
                }, 1500);
            });
        }
    };

    vm.confirmAlipay = function() {
        vm.orderCreateSuccess = true;
    };

    vm.finish = function() {
        $location.path('/recharge');
    };

    vm.useBankTransPay = function() {
        $location.path('/recharge_bank');
    }
}]);
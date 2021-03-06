'use strict';
angular.module('userApp').controller('UserApplyListCtrl', ['$scope', '$location', '$http', '$window', '$filter', 'days', 'njApply', function($scope, $location, $http, $window, $filter, days, njApply) {
    var vm = this;
    $scope.data.menu = 2;
    vm.user = $scope.data.currentUser;

    var apply_list = {};
    var currentApplies;
    vm.itemsPerPage = 3;
    vm.selected = 0;
    vm.showApplyAccount = null;
    vm.user_total_capital = vm.user.finance.balance + vm.user.finance.freeze_capital;
    vm.showAccountWindow = false;
    vm.profit_rate = vm.user.finance.history_deposit ? (vm.user.finance.profit / vm.user.finance.history_deposit * 100).toFixed(0) : 0;

    var lang = new Array();
    var userAgent = navigator.userAgent.toLowerCase();
    var is_opera = userAgent.indexOf('opera') != -1 && opera.version();
    var is_moz = (navigator.product == 'Gecko') && userAgent.substr(userAgent.indexOf('firefox') + 8, 3);
    var is_ie = (userAgent.indexOf('msie') != -1 && !is_opera) && userAgent.substr(userAgent.indexOf('msie') + 5, 3);

    vm.copyCode = function(obj) {
        var a=document.getElementById(obj);
        if(is_ie && a.style.display != 'none') {
            alert('复制成功');
            var rng = document.body.createTextRange();
            rng.moveToElementText(a);
            rng.scrollIntoView();
            rng.select();
            rng.execCommand("Copy");
            rng.collapse(false);
        } else {
            alert("该浏览器不支持此功能，请Ctrl+C复制");
        }
    };

    initData();

    function pageReset() {
        vm.totalItems = currentApplies.length;
        vm.currentPage = 1;
        vm.pageChanged();
    }

    function initData() {
        vm.ongoing_apply_num = 0;
        apply_list = njApply.query({uid:vm.user._id}, function () {
            angular.forEach(apply_list, function(value, key) {
                if (value.status != 1) {
                    ++vm.ongoing_apply_num;
                }
                formatData(value);
            });
            apply_list = $filter('orderBy')(apply_list, 'applyAt', true);
            currentApplies = apply_list;
            pageReset();
        });

        vm.queryItems = [
            {
                name: '全部',
                value: 0
            },
            {
                name: '待支付',
                value: 1
            },
            {
                name: '当前操盘',
                value: 2
            },
            {
                name: '已结算',
                value: 3
            },
            {
                name: '审核中',
                value: 4
            },
            {
                name: '结算中',
                value: 5
            }
        ];
    }

    function formatData (item) {
        item.start_date = item.startTime ? item.startTime : days.startTime();
        item.end_date = item.endTime ? item.endTime : days.endTime(item.start_date, item.period, item.type);
        item.days_till_now = days.tradeDaysTillNow(item);
        item.left_days = item.period - item.days_till_now;
    }

    vm.pageChanged = function() {
        var start = (vm.currentPage - 1) * vm.itemsPerPage;
        var end = start + vm.itemsPerPage;
        if (end > vm.totalItems) {
            end = vm.totalItems;
        }
        vm.showingItems = currentApplies.slice(start, end);
    };

    vm.queryItem = function(item) {
        vm.selected = item.value;
        currentApplies = apply_list.filter(function (elem) {
            if (!item.value) return true;
            return elem.status === item.value;
        });
        pageReset();
    };

    vm.manageApply = function(apply) {
        if (apply.status === 1) {
            $window.location.assign('/apply_confirm/' + apply.serialID);
        } else {
            $location.path('/apply_detail/' + apply.serialID);
        }
    };

    vm.showAccountInfo = function(apply) {
        vm.showAccountWindow = true;
        vm.showingApply = apply;
    };

}]);
'use strict';
angular.module('userApp').controller('UserAccountCtrl', ['$scope', '$filter', '$window', '$http', '$interval', '$location', function($scope, $filter, $window, $http, $interval, $location) {
    var vm = this;
    $('.footer').addClass('marTop200');

    $scope.$on("$routeChangeSuccess", function () {
        if ($location.path().indexOf("/user_account") === 0) {
            var request_category = $location.search()['category'];
            if (!request_category || request_category > 3) {
                request_category = 0;
            }
            vm.currentCategory = vm.categories[request_category];
        }
    });

    var verifyCodeBtnText = "获取手机验证码";
    var verifyBtnDisabled = false;
    $scope.data.menu = 3;
    vm.user = $scope.data.currentUser;
    vm.sendingEmail = false;
    vm.verifyCodeBtnText = verifyCodeBtnText;

    vm.categories = [
        {
            file: '/views/user_info.html',
            name: '个人资料',
            menu: 0,
            value: 0
        },
        {
            file: '/views/identity.html',
            name: '身份认证',
            menu: 1,
            value: 1
        },
        {
            file: '/views/set_finance_pass.html',
            name: '提现密码',
            menu: 2,
            value: 2
        },
        {
            file: '/views/user_email.html',
            name: '邮箱设置',
            menu: 3,
            value: 3
        },
        {
            file: '/views/email_send_confirmation.html',
            name: '邮箱确认',
            menu: 3,
            value: 4
        }
    ];

    function resetUserInfoItem() {
        vm.userInfoItem = [
            {
                value: 1,
                title: "身份认证",
                status: vm.user.identity.id ? "已认证" : "未认证",
                icon: 'spanIcon01',
                info: vm.user.identity.id ? vm.user.identity.name + '(' + $filter('displayIdentityID')(vm.user.identity.id) + ')' : '',
                description: '提现必须先进行身份认证',
                action: "立即认证",
                show_action: vm.user.identity.id ? false : true
            },
            {
                value: 2,
                title: "手机",
                status: "已绑定",
                icon: 'spanIcon02',
                info: $filter('displayMobile')(vm.user.mobile),
                description: '手机用于接收牛金网的通知信息',
                action: "修改",
                show_action: false
            },
            {
                value: 3,
                title: "邮箱",
                status: vm.user.profile.email_verified ? "已绑定" : "未绑定",
                icon: 'spanIcon03',
                info: $filter('displayEmail')(vm.user.profile.email) || '',
                description: '邮箱用于接受账户的各种信息',
                action: "邮箱设置",
                show_action: true
            },
            {
                value: 4,
                title: "登录密码",
                status: "",
                icon: 'spanIcon04',
                info: '',
                description: '登录密码用于牛金账户的登录',
                action: "修改",
                show_action: true
            },
            {
                value: 5,
                title: "提现密码",
                status: vm.user.finance.password ? "已设置" : "未设置",
                icon: 'spanIcon05',
                info: '',
                description: '提现密码用于确认提现',
                action: vm.user.finance.password ? "修改" : "设置",
                show_action: true
            }
        ];
    }

    resetUserInfoItem();

    vm.alerts = [];

    var addAlert = function(type, msg) {
        vm.alerts = [];
        vm.alerts.push({type:type, msg: msg});
    };

    vm.closeAlert = function(index) {
        vm.alerts.splice(index, 1);
    };

    vm.selectCategory = function(c) {
        if (!c) {
            c = vm.categories[0];
        }
        vm.currentCategory = c;
        vm.alerts = [];
    };

    vm.selectedCategory = function() {
        return vm.currentCategory.file;
    };

    vm.itemAction = function(item) {
        switch (item.value) {
            case 1:
                vm.currentCategory = vm.categories[1];
                break;
            case 3:
                vm.currentCategory = vm.categories[3];
                break;
            case 4:
                $window.location.assign('/forgot');
                break;
            case 5:
                vm.currentCategory = vm.categories[2];
                break;
        }
    };

    vm.verifyEmail = function() {
        if (vm.sendingEmail) return;
        vm.sendingEmail = true;
        $http.post('/user/verify_email', {email:vm.user.profile.email})
            .then(function(response) {
                vm.sendingEmail = false;
                if (response.data.success) {
                    vm.currentCategory = vm.categories[4];
                    resetUserInfoItem();
                } else {
                    addAlert('danger', '邮件发送失败,请稍后再试');
                }
            });
    };

    vm.verifyUserIdentity = function() {
        if (!vm.identity_name || !vm.identity_id) {
            addAlert('danger', '请输入有效的姓名及身份证号');
            return;
        }
        if (vm.identity_name.length > 8) {
            addAlert('danger', '您输入的姓名太长，请重新输入');
            return;
        }
        vm.user.identity.name = vm.identity_name;
        vm.user.identity.id = vm.identity_id;
        $http.post('/api/user/' + vm.user._id, vm.user)
            .success(function(data, status) {
                vm.user = data;
                addAlert('success', '实名认证成功');
                resetUserInfoItem();
            })
            .error(function(data, status) {
                addAlert('danger', '实名认证出错,请稍后再试');
            });
    };

    vm.getVerifyCode = function() {
        if (verifyBtnDisabled) {
            return;
        }
        verifyBtnDisabled = true;
        var count = 0;
        vm.verifyCodeBtnText = '60秒后重试';
        var timeId = $interval(function() {
            ++count;
            vm.verifyCodeBtnText = 60-count + '秒后重试';
            if (count === 60) {
                $interval.cancel(timeId);
                vm.verifyCodeBtnText = verifyCodeBtnText;
                verifyBtnDisabled = false;
            }
        }, 1000);

        $http.get('/api/send_sms_verify_code?mobile=' + vm.user.mobile)
            .success(function(data, status, headers, config) {
                addAlert('success', '验证码已发送');
            })
            .error(function(data, status, headers, config) {
                addAlert('danger', '验证码发送失败，请稍后重试');
            });
    };

    vm.setFinancePassword = function() {
        if (!vm.finance_pass || !vm.confirm_finance_pass || !vm.verify_code) {
            addAlert('danger', '请确保各项输入正确');
            return;
        }
        if (vm.finance_pass != vm.confirm_finance_pass) {
            addAlert('danger', '两次密码输入不一致');
            return;
        }
        $http.post('/user/change_finance_pass', {mobile:vm.user.mobile, new_password:vm.finance_pass, confirm_password:vm.confirm_finance_pass, verify_code:vm.verify_code})
            .success(function(data, status, headers, config) {
                addAlert('success', '提现密码设置成功');
                vm.user.finance.password = vm.finance_pass;
                vm.confirm_finance_pass = '';
                vm.verify_code = '';
                resetUserInfoItem();
            })
            .error(function(data, status, headers, config) {
                addAlert('danger', data.error_msg);
            });
    };

    vm.excludeCategory = function (item) {
        return item.value != 4;
    };

    vm.setupEmail = function() {
        if (!vm.user_email) {
            addAlert('danger', '请输入有效的邮箱地址');
            return;
        }
        if (vm.user.profile.email && vm.user.profile.email_verified && vm.user.profile.email == vm.user_email) {
            addAlert('danger', '该邮箱已经绑定');
            return;
        }
        vm.user.profile.email = vm.user_email;
        vm.user.profile.email_verified = false;
        $http.post('/api/user/' + vm.user._id, vm.user)
            .success(function(data, status) {
                $http.post('/user/verify_email', {email:vm.user.profile.email})
                    .success(function(data, status) {
                        console.log('email send success');
                    })
                    .error(function(data, status) {
                        console.log('email send faile');
                    });
                vm.currentCategory = vm.categories[4];
            })
            .error(function(data, status) {
                addAlert('danger', '设置邮箱时出错,请稍后再试');
            });
    };
}]);
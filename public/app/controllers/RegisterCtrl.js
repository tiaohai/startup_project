(function () {
    'use strict';
    angular.module('registerApp', ['ui.bootstrap', 'commonApp']);
    angular.module('registerApp').controller('RegisterCtrl', ['$http', '$location', '$window', '$interval', function($http, $location, $window, $interval) {
        var vm = this;

        vm.show_verify_window = false;
        vm.verify_code_error = false;

        vm.register = function() {
            if (!vm.mobile) {
                addAlert('danger', '请输入正确的手机号');
                return;
            }
            if (!vm.password) {
                addAlert('danger', '请输入密码，长度6到20位');
                return;
            }
            if (!vm.confirm_password) {
                addAlert('danger', '请再输一遍密码，长度6到20位');
                return;
            }
            if (vm.password != vm.confirm_password) {
                addAlert('danger', '两次密码应该保持一致');
                return;
            }
            var data = {
                mobile: vm.mobile,
                password: vm.password,
                confirm_password: vm.confirm_password
            };
            $http.post('/api_signup', data)
                .success(function(data, status, headers, config) {
                    vm.show_verify_window = true;
                    vm.getVerifyCode();
                })
                .error(function(data, status, headers, config) {
                    addAlert('danger', data.error_msg);
                });
        };

        vm.verifyCodeBtnText = '重发验证码';
        vm.verifyBtnDisabled = false;
        vm.getVerifyCode = function() {
            if (vm.verifyBtnDisabled) {
                return;
            }
            vm.verifyBtnDisabled = true;
            var count = 0;
            vm.verifyCodeBtnText = '60秒后重试';
            var timeId = $interval(function() {
                ++count;
                vm.verifyCodeBtnText = 60-count + '秒后重试';
                if (count === 60) {
                    $interval.cancel(timeId);
                    vm.verifyCodeBtnText = '重发验证码';
                    vm.verifyBtnDisabled = false;
                }
            }, 1000);

            $http.get('/api/send_sms_verify_code?mobile=' + vm.mobile)
                .success(function(data, status, headers, config) {
                    //addAlert('success', '验证码已发送');
                })
                .error(function(data, status, headers, config) {
                    //addAlert('danger', '验证码发送失败，请稍后重试');
                });
        };

        vm.confirmVerifyCode = function() {
            if (!vm.verify_code) {
                addAlert('danger', '请输入验证码');
                return;
            }
            $http.post('/verify_mobile_code', {verify_code:vm.verify_code})
                .success(function(data, status, headers, config) {
                    $('#verify_code')[0].value = vm.verify_code;
                    $('#signup-form')[0].submit();
                })
                .error(function(data, status, headers, config) {
                    if (data.errorCode === 1) {
                        vm.verify_code_error = true;
                    }
                });
        };

        vm.login = function() {
            if (!vm.mobile) {
                addAlert('danger', '请输入正确的手机号');
                return;
            }
            if (!vm.password) {
                addAlert('danger', '请输入密码，长度6到20位');
                return;
            }
            $('login-form')[0].submit();
            /*
            console.log('submit');
            $http.post('/login', {mobile:vm.mobile, password:vm.password})
                .success(function(data, status, headers, config) {
                    console.log(status);
                    console.log(data);
                })
                .error(function(data, status, headers, config) {
                    console.log(status);
                    console.log(data);
                });
                */
        };

        vm.alerts = [];

        var addAlert = function(type, msg) {
            vm.alerts.push({type:type, msg: msg});
        };

        vm.closeAlert = function(index) {
            vm.alerts.splice(index, 1);
        };
    }]);
}());
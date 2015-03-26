'use strict';
angular.module('userApp').controller('UserApplyCtrl', ['$scope', '$window', '$location', '$routeParams', '$modal', '$http', 'njApply', 'warn_factor', 'sell_factor', 'days', function($scope, $window, $location, $routeParams, $modal, $http, njApply, warn_factor, sell_factor, days) {
    var vm = this;
    $('.footer').addClass('marTop200');

    vm.currentApply = {};
    $scope.$on("$routeChangeSuccess", function () {
        if ($location.path().indexOf("/apply_detail/") == 0) {
            var serial_id = $routeParams["serial_id"];
            njApply.get({uid:$scope.data.currentUser._id, serial_id:serial_id}, function(apply) {
                vm.currentApply = apply;
                formatApply(vm.currentApply);
                vm.warn_amount = vm.currentApply.amount * warn_factor;
                vm.sell_amount = vm.currentApply.amount * sell_factor;
            });
        }
    });

    function formatApply(item) {
        item.start_date = item.startTime ? item.startTime : days.startTime();
        item.end_date = item.endTime ? item.endTime : days.endTime(item.start_date, item.period);
    }

    vm.alerts = [];

    var addAlert = function(type, msg) {
        vm.alerts.push({type:type, msg: msg});
    };

    vm.closeAlert = function(index) {
        vm.alerts.splice(index, 1);
    };

    vm.closeApply = function() {
        var modalInstance = $modal.open({
            templateUrl: '/views/closeApplyModal.html',
            controller: 'CloseApplyModalCtrl',
            //size: size,
            resolve: {}
        });

        modalInstance.result.then(function (content) {
            $http.post('/user/apply_close/' + vm.currentApply.serialID, {})
                .success(function(data, status, headers, config) {
                    vm.currentApply.status = 5;
                    addAlert('success', '结算申请已经提交');
                })
                .error(function(data, status, headers, config) {
                    addAlert('danger', '结算申请提交失败，请稍后重试');
                });
        }, function () {
        });
    };

}]);

angular.module('userApp').controller('CloseApplyModalCtrl', ['$scope', '$modalInstance', function ($scope, $modalInstance) {
    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);

angular.module('adminApp', ['ngResource', 'ngRoute', 'ui.bootstrap', 'commonApp']);

angular.module('adminApp').config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    //$locationProvider.html5Mode(true);
    $routeProvider
        .when('/users', { templateUrl: '/admin/user_list',
            controller: 'AdminUserListCtrl as userVM'
        })
        .when('/applies/:uid', { templateUrl: '/admin/apply_list',
            controller: 'AdminApplyListCtrl as applyVM'
        })
        .when('/orders/:uid', { templateUrl: '/admin/order_list',
            controller: 'AdminOrderListCtrl as orderVM'
        })
        .when('/one_day_expire_apply', { templateUrl: '/admin/apply_expire_in_one_day',
            controller: 'AdminExpireApplyCtrl as expireApplyVM'
        })
        .otherwise({
            redirectTo: '/users'
        });
}]);
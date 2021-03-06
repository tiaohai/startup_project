angular.module('adminApp', ['ngResource', 'ngRoute', 'ui.bootstrap', 'commonApp']);

angular.module('adminApp').config(['$routeProvider', '$locationProvider', '$httpProvider', function($routeProvider, $locationProvider, $httpProvider) {
    // Initialize get if not there
    if (!$httpProvider.defaults.headers.get) {
        $httpProvider.defaults.headers.get = {};
    }
    // Disable IE ajax request caching
    $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
    $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';

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
        .when('/closing_applies', { templateUrl: '/admin/closing_apply_list',
            controller: 'AdminClosingApplyCtrl as closingApplyVM'
        })
        .when('/get_profit_orders', { templateUrl: '/admin/get_profit_order_list',
            controller: 'AdminGetProfitOrderListCtrl as profitOrderListVM'
        })
        .when('/add_deposit_orders', { templateUrl: '/admin/add_deposit_order_list',
            controller: 'AdminAddDepositOrderListCtrl as addDepositOrderListVM'
        })
        .when('/pending_applies', { templateUrl: '/admin/pending_apply_list',
            controller: 'AdminPendingApplyCtrl as pendingApplyVM'
        })
        .when('/withdraw_orders', { templateUrl: '/admin/withdraw_order_list',
            controller: 'AdminWithdrawOrderCtrl as withdrawOrderVM'
        })
        .when('/alipay_orders', { templateUrl: '/admin/alipay_order_list',
            controller: 'AdminAlipayOrderListCtrl as alipayOrderListVM'
        })
        .when('/my_users', { templateUrl: '/admin/my_user_list',
            controller: 'AdminMyUserListCtrl as myUserVM'
        })
        .when('/recharge_orders', { templateUrl: '/admin/recharge_order_list',
            controller: 'AdminRechargeOrderListCtrl as rechargeOrderVM'
        })
        .when('/orders', { templateUrl: '/admin/orders',
            controller: 'AdminOrderCtrl as orderVM'
        })
        .otherwise({
            redirectTo: '/users'
        });
}]);

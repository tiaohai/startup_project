angular.module('userApp', ['ngResource', 'ngRoute', 'ui.bootstrap', 'commonApp']);

angular.module('userApp').config(['$routeProvider', '$httpProvider', function($routeProvider, $httpProvider) {
    // Initialize get if not there
    if (!$httpProvider.defaults.headers.get) {
        $httpProvider.defaults.headers.get = {};
    }
    // Disable IE ajax request caching
    $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
    $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';

    $routeProvider
        .when('/index', { templateUrl: '/user/home',
            controller: 'UserHomeCtrl as homeVM'
        })
        .when('/apply_detail/:serial_id', { templateUrl: '/user/apply_detail',
            controller: 'UserApplyCtrl as applyVM'
        })
        .when('/user_capital', { templateUrl: '/user/user_capital',
            controller: 'UserCapitalCtrl as capitalVM'
        })
        .when('/user_account', { templateUrl: '/user/user_account',
            controller: 'UserAccountCtrl as accountVM'
        })
        .otherwise({
            redirectTo: '/index'
        });
}]);

angular.module('userApp2', ['ngResource', 'ngRoute', 'ui.bootstrap', 'commonApp']);

angular.module('userApp2').config(['$routeProvider', function($routeProvider) {
    // Initialize get if not there
    if (!$httpProvider.defaults.headers.get) {
        $httpProvider.defaults.headers.get = {};
    }
    // Disable IE ajax request caching
    $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
    $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';

    $routeProvider
        .when('/home', { templateUrl: '/user/account_summary',
            controller: 'UserHomeCtrl2 as homeVM'
        })
        .when('/recharge', { templateUrl: '/user/recharge',
            controller: 'UserRechargeCtrl as rechargeVM'
        })
        .when('/applies', { templateUrl: '/user/apply_list',
            controller: 'UserApplyListCtrl as applyVM'
        })
        .when('/settings', { templateUrl: '/user/account_setting',
            controller: 'UserAccountCtrl2 as accountVM'
        })
        .when('/add_card', { templateUrl: '/user/add_card',
            controller: 'UserCardCtrl as cardVM'
        })
        .when('/withdraw', { templateUrl: '/user/withdraw',
            controller: 'UserWithdrawCtrl as withdrawVM'
        })
        .otherwise({
            redirectTo: '/home'
        });
}]);
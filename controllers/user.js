var passport = require('passport'),
    User = require('../models/User'),
    Order = require('../models/Order'),
    Apply = require('../models/Apply'),
    Homas = require('../models/Homas'),
    userViewModel = require('../viewModels/user'),
    nodemailer = require('nodemailer'),
    crypto = require('crypto'),
    sms = require('../lib/sms'),
    needle = require('needle'),
    ursa = require('ursa'),
    log4js = require('log4js'),
    logger = log4js.getLogger('admin'),
    util = require('../lib/util'),
    env = process.env.NODE_ENV = process.env.NODE_ENV || 'development',
    config = require('../config/config')[env],
    async = require('async');


module.exports.postLogin = function(req, res, next) {
    req.assert('mobile', '无效的手机号码').len(11, 11).isInt();
    req.assert('password', '密码不能为空').notEmpty();

    var errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/login');
    }

    var auth = passport.authenticate('local', function(err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash('errors', { msg: info.message });
            return res.redirect('/login');
        }
        req.login(user, function(err) {
            if (err) {return next(err);}
            if (req.session.lastLocation) {
                var location = req.session.lastLocation;
                req.session.lastLocation = null;
                res.redirect(location);
            } else {
                res.redirect('/user');
            }
        });
    });
    auth(req, res, next);
};

module.exports.postSignup = function(req, res, next) {
    req.assert('mobile', '无效的手机号码').len(11, 11).isInt();
    req.assert('password', '密码不能为空').notEmpty();
    req.assert('password', '密码至少需要6位').len(6);
    req.assert('confirm-password', '两次密码不匹配').equals(req.body.password);

    var errors = req.validationErrors();
    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/signup');
    }

    var user = new User({
        mobile: req.body.mobile,
        password: req.body.password
    });

    User.findOne({ mobile: req.body.mobile }, function(err, existingUser) {
        if (err) {
            return next(err);
        }
        if (existingUser) {
            req.flash('errors', { msg: '该手机号已经注册了.' });
            return res.redirect('/signup');
        }
        user.save(function(err) {
            if (err) return next(err);
            req.logIn(user, function(err) {
                if (err) return next(err);
                res.redirect('/user');
            });
        });
    });
};

module.exports.logout = function(req, res) {
    req.logout();
    res.redirect('/');
};

module.exports.postLogout = function(req, res) {
    req.logout();
    res.send();
};

module.exports.getIndex = function(req, res, next) {
    var user = req.user;

    user.getOrders(function(err, orders) {
        if(err) return next(err);
        res.render('user/index', {
            bootstrappedUser: JSON.stringify(userViewModel(user, orders)),
            layout: null
        });
    });
};

module.exports.getHome = function(req, res) {
    res.render('user/home', {layout:null});
};

module.exports.getProfile = function(req, res) {
    res.render('user/profile', {layout:null});
};

module.exports.getOrders = function(req, res) {
    res.render('user/orders', {layout:null});
};

module.exports.getSecurity = function(req, res) {
    res.render('user/security', {layout:null});
};

module.exports.getVerifyEmail = function(req, res) {
    res.render('user/verify_email', {layout:null});
};

module.exports.postVerifyEmail = function(req, res, next) {
    req.assert('email', '无效的邮件地址.').isEmail();

    var errors = req.validationErrors();

    if (errors) {
        return res.send({success:false, reason:errors[0].msg});
    }

    var user = req.user;
    async.waterfall([
        function(done) {
            crypto.randomBytes(16, function(err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done) {
            user.verifyEmailToken = token;

            user.save(function(err) {
                done(err, token, user);
            });
        },
        function(token, user, done) {
            var transporter = nodemailer.createTransport({
                host: "smtp.qq.com",
                secureConnection: true,
                port: 465,
                auth: {
                    user: "niu_jin_wang@qq.com",
                    pass: "so6UoWg6"
                }
            });
            var mailOptions = {
                to: user.profile.email,
                from: 'support@niujin.com',
                subject: '验证您在牛金网使用的邮箱',
                text: 'You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n' +
                'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            transporter.sendMail(mailOptions, function(err) {
                req.flash('info', { msg: 'An e-mail has been sent to ' + user.profile.email + ' with further instructions.' });
                done(err, 'done');
                transporter.close();
            });
        }
    ], function(err) {
        if (err) return res.send({success:false, reason:err.toString()});
        res.send({success:true});
    });
};

module.exports.getIdentity = function(req, res) {
    res.render('user/identity', {layout:null});
};

module.exports.getUserPay = function(req, res) {
    res.render('user/mypay', {layout:null});
};

module.exports.getWithdraw = function(req, res) {
    res.render('user/withdraw', {layout:null});
};

module.exports.postWithdraw = function(req, res) {
    var data = req.body;
    var amount = Number(data.order.amount);

    async.waterfall([
        function(callback) {
            User.findById(req.user.id, function(err, user) {
                if (!err && !user) {
                    err = 'user not found';
                }
                callback(err, user);
            });
        },
        function(user, callback) {
            if (user.finance.balance < amount) {
                callback('余额不足');
            } else {
                user.compareFinancePassword(data.password, function (err, isMatch) {
                    if (!err && !isMatch) {
                        err = '提现密码错误!'
                    }
                    callback(err, user);
                });
            }
        },
        function(user, callback) {
            Order.create(data.order, function(err, order) {
                callback(err, user);
            });
        },
        function(user, callback) {
            user.finance.balance -= amount;
            user.finance.freeze_capital += amount;
            user.save(function(err) {
                callback(err, user);
            });
        }
    ], function(err, result) {
        if (err) {
            res.status(401);
            res.send({reason:err.toString()});
        } else {
            res.send({success:true});
        }
    });
};

module.exports.getResetPassword = function(req, res) {
    res.render('user/change_pass', {layout:null});
};

module.exports.getApplyList = function(req, res) {
    res.render('user/apply_list', {layout:null});
};

module.exports.getUser = function(req, res, next) {
    User.findById(req.params.id, function(err, user) {
        if (err) next(err);
        res.send(user);
    });
};

module.exports.updateUser = function(req, res, next) {
    logger.debug('updateUser');
    var uid = req.params.id ? req.params.id : req.user.id;
    if (req.params.id && req.params.id !== req.user.id) {
        return res.send({success:false, reason:'无效的用户！'});
    }
    var userData = req.body;
    User.update({_id:uid}, userData, function (err, numberAffected, raw) {
        if (err) {
            return res.send({success:false, reason:err.toString()});
        }
        res.send({success:true});
    });
};

module.exports.postUpdatePassword = function(req, res, next) {
    req.assert('password', '密码至少需要6位').len(6);
    req.assert('confirm_password', '两次密码不匹配').equals(req.body.password);

    var errors = req.validationErrors();

    if (errors) {
        return res.send({success:false, reason:errors[0].msg});
    }

    User.findById(req.user.id, function(err, user) {
        if (err) return res.send({success: false, reason: err.toString()});
        if (!user) return res.send({success: false, reason: '无效的用户！'});
        user.comparePassword(req.body.old_password, function (err, isMatch) {
            if (err) return res.send({success: false, reason: err.toString()});
            if (!isMatch) {
                return res.send({success: false, reason: '旧密码错误'});
            } else {
                user.password = req.body.password;

                user.save(function (err) {
                    if (err) return res.send({success: false, reason: err.toString()});
                    res.send({success: true});
                });
            }
        });
    });
};

module.exports.resetPassword = function(req, res, next) {
    req.assert('verify_code', '验证码错误').equals(req.session.sms_code);
    req.assert('password', '密码至少需要6位').len(6);
    req.assert('confirm_password', '两次密码不匹配').equals(req.body.password);

    var errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/forgot');
    }

    User.findOne({ mobile: req.body.mobile }, function(err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash('errors', { msg: '该手机号还未注册.' });
            return res.redirect('/forgot');
        }
        user.password = req.body.password;
        user.save(function (err) {
            if (err) {
                req.flash('errors', { msg: err.toString() });
                return res.redirect('/forgot');
            }
            req.flash('info', { msg: '您的密码已经修改成功!' });
            res.redirect('/login');
        });
    });
};

module.exports.sendVerifyCode = function(req, res, next) {
    if (!req.query.mobile) {
        return res.send({success:false, reason:'no mobile specified'});
    }
    var code = sms.generateVerifyCode();
    sms.sendSMS(req.query.mobile, code);
    req.session.sms_code = code;
    res.send({success:true});
    //res.send({success:true, verifyCode:code});
};

module.exports.payByBalance = function(req, res, next) {
    if (!req.user) {
        return res.send({success:false, reason:'无效的用户!'});
    }
    var data = req.body;
    console.log(req.body);

    User.findById(req.user.id, function(err, user) {
        if (err) {
            res.status(500);
            logger.warn('payByBalance error:' + apply_id);
            return res.send({success:false, reason:err.toString()});
        }
        if (!user) {
            logger.warn('payByBalance error. no enough balance to pay apply:' + apply_id);
            return res.send({success:false, reason:'无效的用户!'});
        }
        if (data.apply_id) {
            Apply.findOne({serialID:data.apply_id}, function(err, apply) {
                if (err) {
                    return res.send({success:false, reason:err.toString()});
                }
                if (apply.status === 2) {
                    var pay_amount = Number(data.total_amount);
                    apply.deposit += pay_amount;
                    apply.save(function (err) {
                        if (err) {
                            logger.warn('payByBalance failed:' + err.toString());
                            return res.send({success:false, reason:err.toString()});
                        }
                        Order.update({_id:data.order_id}, {status:1}, function(err, numberAffected, raw) {
                            if (err) {
                                logger.warn('payByBalance error.update order error:' + data.order_id);
                                return res.send({success:false, reason:err.toString()});
                            }
                            user.finance.balance -= pay_amount;
                            user.save(function (err) {
                                if (err) {
                                    res.status(500);
                                    logger.warn('payByBalance failed:' + err.toString());
                                    return res.send({success:false, reason:err.toString()});
                                }
                                res.send({success:true, data:user.finance.balance});
                            });
                        });
                    });
                } else if (apply.status === 1) {
                    var serviceFee = apply.amount / 10000 * config.serviceCharge * apply.period;
                    var total = apply.deposit.toFixed(2) + serviceFee.toFixed(2);
                    var user_balance = user.finance.balance.toFixed(2);
                    if (user_balance < total) {
                        logger.warn('payByBalance error. no enough balance to pay apply:' + apply_id);
                        return res.send({success:false, reason:'payApply error. no enough balance to pay apply:' + apply_id});
                    } else {
                        apply.status = 4;
                        Homas.findOne({using:false}, function(err, homas) {
                            if (err || !homas) {
                                logger.warn('failed to assign homas account to apply:' + apply._id);
                                return res.send({success:false, reason:'failed to assign homas account to apply:' + apply._id});
                            }
                            homas.using = true;
                            homas.assignAt = Date.now();
                            homas.applySerialID = apply.serialID;
                            homas.save(function(err) {
                                if (err) {
                                    logger.warn('failed to assign homas account to apply:' + apply._id);
                                } else {
                                    apply.status = 2;
                                    apply.account = homas.account;
                                    apply.password = homas.password;
                                    var startDay = util.getStartDay();
                                    apply.startTime = startDay.toDate();
                                    apply.endTime = util.getEndDay(startDay, apply.period).toDate();
                                }
                                apply.save(function (err) {
                                    if (err) {
                                        logger.warn('payByBalance failed:' + err.toString());
                                        return res.send({success:false, reason:err.toString()});
                                    }
                                    Order.update({_id:data.order_id}, {status:1}, function(err, numberAffected, raw) {
                                        if (err) {
                                            logger.warn('payByBalance error.update order error:' + data.order_id);
                                            return res.send({success:false, reason:err.toString()});
                                        }
                                        user.finance.balance -= total;
                                        user.save(function (err) {
                                            if (err) {
                                                res.status(500);
                                                logger.warn('payByBalance failed:' + err.toString());
                                                return res.send({success:false, reason:err.toString()});
                                            }
                                            res.send({success:true, data:user.finance.balance});
                                        });
                                    });
                                });
                            });
                        });
                    }
                } else {
                    logger.warn('payByBalance failed apply not waiting for pay');
                    res.send({success:false, reason:'payByBalance failed apply not waiting for pay'});
                }
            });
        } else {
            logger.warn('payByBalance failed apply serialID not found in request');
            res.send({success:false, reason:'payByBalance failed apply serialID not found in request'});
        }
    });
};

module.exports.updateBalance = function (req, res, next) {
    if (!req.user) {
        return res.send({success:false, reason:'无效的用户!'});
    }
    var data = req.body;
    var pay_amount = Number(data.pay_amount);
    console.log(pay_amount);
    if (pay_amount <= 0) {
        return res.send({success:false, reason:'无效的支付额:'+pay_amount});
    }

    User.findById(req.user.id, function(err, user) {
        if (err) {
            res.status(500);
            req.session.pay_error = {
                reason: err.toString()
            };
            return res.send({success:false, reason:err.toString()});
        }
        if (!user) {
            req.session.pay_error = {
                reason: '无效的用户!'
            };
            return res.send({success:false, reason:'无效的用户!'});
        }

        user.finance.balance += pay_amount;

        user.save(function (err) {
            if (err) {
                req.session.pay_error = {
                    reason: err.toString()
                };
                return res.send({success:false, reason:err.toString()});
            }
            return res.send({success:true});
        });
    });
};

module.exports.getResetFinancePassword = function(req, res) {
    res.render('user/change_finance_pass', {layout:null});
};

module.exports.postUpdateFinancePassword = function(req, res, next) {
    req.assert('new_password', '密码至少需要6位').len(6);
    req.assert('confirm_password', '两次密码不匹配').equals(req.body.new_password);

    var errors = req.validationErrors();

    if (errors) {
        return res.send({success:false, reason:errors[0].msg});
    }

    User.findById(req.user.id, function(err, user) {
        if (err) return res.send({success: false, reason: err.toString()});
        if (!user) return res.send({success: false, reason: '无效的用户！'});
        user.comparePassword(req.body.password, function (err, isMatch) {
            if (err) return res.send({success: false, reason: err.toString()});
            if (!isMatch) {
                return res.send({success: false, reason: '登录密码错误!'});
            } else {
                user.finance.password = req.body.new_password;

                user.save(function (err) {
                    if (err) return res.send({success: false, reason: err.toString()});
                    res.send({success: true});
                });
            }
        });
    });
};

module.exports.verifyFinancePassword = function(req, res, next) {
    if (!req.user) {
        return res.send({success:false, reason:'无效的用户!'});
    }
    User.findById(req.user.id, function(err, user) {
        if (err) return res.send({success: false, reason: err.toString()});
        if (!user) return res.send({success: false, reason: '无效的用户！'});
        user.compareFinancePassword(req.body.password, function (err, isMatch) {
            if (err) return res.send({success: false, reason: err.toString()});
            if (!isMatch) {
                return res.send({success: false, reason: '提现密码错误!'});
            } else {
                res.send({success: true, result: user.finance.password});
            }
        });
    });
};

module.exports.getIAppPayTransid = function(req, res) {
    console.log('getPayTransid');
    var orderID = req.body.id;
    var price = req.body.price;
    var uid = req.body.uid;
    var data = {
        appid: '3002011663',
        waresid: 1,
        waresname: '股票配资',
        cporderid: orderID,
        price: Number(price),
        currency: 'RMB',
        appuserid: uid,
        notifyurl: config.pay_callback_domain + '/api/iapp_feedback'
    };
    /*
    needle.post('http://ipay.iapppay.com:9999/payapi/order', data, { multipart: true })
        .on('readable', function() {
            while (result = this.read()) {
                console.log(result.toString());
            }
        })
        .on('end', function() {
            console.log('Ready-o, friend-o.');
            res.send({success:true});
        });
     */
    var jsonData = JSON.stringify(data);
    var client_private = '-----BEGIN RSA PRIVATE KEY-----\n'+
        'MIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBAOW3mZeDOg58WF61\n'+
        '8rD4RN8plLAOOgOH1QAAR3y+vVQCxZpVvjLPLDZP0EBdWfSlFpkLIBaVPBiNq6dx\n'+
        'fyzrG04lX1EftmQyost7s9vkkjPj7fdbnQhVGvdee3f3/bLr0rC7By6qxiv5PCWF\n'+
        'mE1Asb9CnK/DlUPrCb8QE0Vf2fkbAgMBAAECgYEA3LdI2xwaFzsASZf2pHUW73jr\n'+
        'RTGWKjhDvumFxmUaUnMLW9vQkM8gAtszE/Td7sMEcG4RGcGv6UONz6escwM+ykdn\n'+
        'qpiqBo2aX3UYv6YJy2HV/9RmIS99dny/H6gRzMCyomPfyqXPLbmCNTcotb6zVs+h\n'+
        'lPN5o925veq1Y0TlF3kCQQD+0rgkWfrWt/7uVzkI7aXlewgTrvg5dJ0wdcDcSew/\n'+
        'AEbW2K1B1wB9fkNPKFgbp3PhSGjQba3ZvHfRQGo5/y1/AkEA5scylT3NNHpneE5L\n'+
        'TOKiDfk5LHraRS4k1N8pGpUXKFmwQDDvPq+1nBhe1KiR6ZggDep4aAPKzseheR4V\n'+
        'gcH6ZQJAIpj1i2n0FqcQo8eP5NhvR8L2i8WbyiE9HlE+iCo5OyyMcasliuToGiHE\n'+
        'fcDahZassw+ju3jIu+FM20pFoe41fQJARWfXQKcrlgLSJ450exUV49n2Zfg0uOWd\n'+
        '0h+jfwkjw9Dlfwi4i0PQ/LcfnhlseLJ1wXmo6K9rSTEk0QZJNZMfOQJBAO78rY7M\n'+
        '17fetd0VcaWnraXNBC22pWrQnLo9QpskV5hOu5gxW4FbED4L5NA0JeI1nyFLZGr/\n'+
        'PBBcfmNYWA6LmzQ=\n'+
        '-----END RSA PRIVATE KEY-----';
    var priv = ursa.createPrivateKey(new Buffer(client_private));
    var content = new Buffer(jsonData);
    var sig = priv.hashAndSign('md5', content, 'utf8', 'base64');
    var data = 'transdata=' + jsonData + '&sign=' + sig + '&signtype=RSA';
    /*
    console.log(sig);
    var otherData = 'transdata={"appid":"3002011663","waresid":1,"waresname":"股票配资","cporderid":"54feadf6154755cd492fb0b6","price":107.52,"currency":"RMB","appuserid":"54f51b9d0fb27dbf0a402666"}&sign=E1qEtYQKW1VLf0mn0OT05AMYv77xh0ramUAENOPS59jDKY4dViaIu0pDOzTGJGxeCLzfjCG0dfzXlNd5ofhGiHsVwh7TwvoVkqhb1dkyWNqvxKkrCWCvotKysJlZg5dh0O+VUQj0xUph1FOwEhJFNoX1gAabFkZb01mQlP/4QPI=&signtype=RSA';
    console.log(otherData);
    */
    needle.post('http://ipay.iapppay.com:9999/payapi/order', data, function(err, resp, body) {
        logger.debug(body);
        if (body) {
            var index = body.indexOf('{');
            var index2 = body.indexOf('}');
            var len = index2 - index + 1;
            var result = body.substr(index, len);
            var obj = JSON.parse(result);
            //transdata={"code":1002,"errmsg":"请求参数错误"}
            logger.info(obj);
            if (obj.transid) {
                res.send({success:true, transid:obj.transid});
                var orderData = {
                    transID: obj.transid
                };
                Order.update({_id:orderID}, orderData, function (err, numberAffected, raw) {
                    if (err) {
                        logger.warn('error when updateOrder:' + err.toString());
                    }
                });
            } else {
                res.send({success:false});
            }
        } else {
            logger.debug(error);
            logger.debug(resp);
            res.send({success:false});
        }
    });
};

module.exports.iappPayFeedback = function(req, res) {
    logger.debug('iappPayFeedback');
    logger.debug(req.body);
    if (req.body.transdata) {
        var result = JSON.parse(req.body.transdata);
        logger.debug(result);
        if (result.result === 0) {
            async.waterfall([
                function(callback) {
                    Order.findById(result.cporderid, function(err, order) {
                        if (!err && !order) {
                            err = 'order not found:' + result.OrderNo;
                        }
                        callback(err, order);
                    });
                },
                function(order, callback) {
                    if (order.status === 1) {
                        callback('order already paid:' + order._id);
                        return;
                    }
                    var pay_amount = Number(result.money);
                    if (pay_amount <= 0) {
                        callback('pay_amount not valid:' + pay_amount);
                        return;
                    }
                    if (order.amount !== pay_amount) {
                        callback('pay_amount not match order\'s amount: ' + order.amount + ' vs ' + pay_amount);
                        return;
                    }
                    order.status = 1;
                    order.payType = 0;
                    order.save(function (err) {
                        callback(err, order, pay_amount);
                    });
                },
                function(order, pay_amount, callback) {
                    logger.info("pay success for order:" + order._id + " by " + pay_amount);
                    User.findById(order.userID, function(err, user) {
                        if (!err && !user) {
                            err = 'can not find user:' + order.userID;
                        }
                        callback(err, user, order, pay_amount);
                    });
                },
                function(user, order, pay_amount, callback) {
                    user.finance.balance += pay_amount;
                    user.save(function(err) {
                        callback(err, user, order, pay_amount);
                    });
                },
                function(user, order, pay_amount, callback) {
                    logger.debug('iappPayFeedback success update user:' + user._id + ' and order:' + order._id);
                    if (order.applySerialID) {
                        logger.info('iappPayFeedback pay apply');
                        callback(null, true, user, order.applySerialID, pay_amount);
                    } else {
                        callback(null, false, null, null, null);
                    }
                },
                function(working, user, apply_serial_id, pay_amount, callback) {
                    if (working) {
                        Apply.findOne({serialID: apply_serial_id}, function(err, apply) {
                            if (!err && !apply) {
                                err = 'can not found apply when pay apply:' + apply_serial_id;
                            }
                            callback(err, true, user, apply, pay_amount);
                        });
                    } else {
                        callback(null, false, null, null, null);
                    }
                },
                function(working, user, apply, pay_amount, callback) {
                    if (working) {
                        if (apply.status === 1) {
                            var serviceFee = apply.amount / 10000 * config.serviceCharge * apply.period;
                            var total = apply.deposit.toFixed(2) + serviceFee.toFixed(2);
                            var user_balance = user.finance.balance.toFixed(2);
                            if (user_balance < total) {
                                callback('no enough balance to pay apply:' + apply.serialID);
                            } else {
                                apply.status = 4;
                                Homas.findOne({using:false}, function(err, homas) {
                                    if (!err && !homas) {
                                        err = 'failed to assign homas account to apply:' + apply.serialID;
                                    }
                                    callback(err, true, user, apply, homas, total);
                                });
                            }
                        } else if (apply.status === 2) { // in this case (apply in process, order pay for it), it means the order is for add deposit
                            user.finance.balance -= pay_amount;
                            user.save(function(err) {
                                callback(err, false, null, null, null, null);
                            });
                        }
                    } else {
                        callback(null, false, null, null, null, null);
                    }
                },
                function(working, user, apply, homas, total, callback) {
                    if (working) {
                        homas.using = true;
                        homas.assignAt = Date.now();
                        homas.applySerialID = apply.serialID;
                        homas.save(function(err) {
                            callback(err, true, user, apply, homas, total);
                        });
                    } else {
                        callback(null, false, user, apply, homas, total);
                    }
                },
                function(working, user, apply, homas, total, callback) {
                    if (working) {
                        apply.status = 2;
                        apply.account = homas.account;
                        apply.password = homas.password;
                        var startDay = util.getStartDay();
                        apply.startTime = startDay.toDate();
                        apply.endTime = util.getEndDay(startDay, apply.period).toDate();
                        apply.save(function (err) {
                            callback(err, true, user, total);
                        });
                    } else {
                        callback(null, false, user, total);
                    }
                },
                function(working, user, total, callback) {
                    if (working) {
                        user.finance.balance -= total;
                        user.save(function (err) {
                            callback(err, 'success pay apply');
                        });
                    } else {
                        callback(null, 'done');
                    }
                }
            ], function(err, result) {
                if (err) {
                    logger.error('iappPayFeedback error:' + err.toString());
                } else {
                    logger.info('iappPayFeedback result:' + result);
                }
            });
        } else {
            logger.warn('iappPayFeedback pay failed, result not 0');
        }
    } else {
        logger.warn('iappPayFeedback pay failed, no data returned');
    }
    res.send('SUCCESS');
};

module.exports.thankYouForPay = function(req, res, next) {
    logger.debug('thankYouForPay');
    logger.debug(req.body);
    if (req.query.apply_id) {
        return res.render('thank_you_for_pay', {apply_id:req.query.apply_id});
    }
    res.render('thank_you_for_pay');
};

module.exports.shengpayFeedback = function(req, res, next) {
    logger.debug('shengpayFeedback');
    logger.debug(req.body);
    var result = req.body;
    if (result.TransStatus && result.TransStatus === '01') {
        async.waterfall([
            function(callback) {
                Order.findById(result.OrderNo, function(err, order) {
                    if (!err && !order) {
                        err = 'order not found:' + result.OrderNo;
                    }
                    callback(err, order);
                });
            },
            function(order, callback) {
                if (order.status === 1) {
                    callback('order already paid:' + order._id);
                    return;
                }
                var pay_amount = Number(result.TransAmount);
                if (pay_amount <= 0) {
                    callback('pay_amount not valid:' + pay_amount);
                    return;
                }
                if (order.amount !== pay_amount) {
                    callback('pay_amount not match order\'s amount: ' + order.amount + ' vs ' + pay_amount);
                    return;
                }
                order.status = 1;
                order.payType = 1;
                order.transID = result.TransNo;
                order.save(function (err) {
                    callback(err, order, pay_amount);
                });
            },
            function(order, pay_amount, callback) {
                logger.info("pay success for order:" + order._id + " by " + pay_amount);
                User.findById(order.userID, function(err, user) {
                    if (!err && !user) {
                        err = 'can not find user:' + order.userID;
                    }
                    callback(err, user, order, pay_amount);
                });
            },
            function(user, order, pay_amount, callback) {
                user.finance.balance += pay_amount;
                user.save(function(err) {
                    callback(err, user, order, pay_amount);
                });
            },
            function(user, order, pay_amount, callback) {
                logger.debug('shengpayFeedback success update user:' + user._id + ' and order:' + order._id);
                if (order.applySerialID) {
                    logger.info('shengpayFeedback pay apply');
                    callback(null, true, user, order.applySerialID, pay_amount);
                } else {
                    callback(null, false, null, null, null);
                }
            },
            function(working, user, apply_serial_id, pay_amount, callback) {
                if (working) {
                    Apply.findOne({serialID: apply_serial_id}, function(err, apply) {
                        if (!err && !apply) {
                            err = 'can not found apply when pay apply:' + apply_serial_id;
                        }
                        callback(err, true, user, apply, pay_amount);
                    });
                } else {
                    callback(null, false, null, null, null);
                }
            },
            function(working, user, apply, pay_amount, callback) {
                if (working) {
                    if (apply.status === 1) {
                        var serviceFee = apply.amount / 10000 * config.serviceCharge * apply.period;
                        var total = apply.deposit.toFixed(2) + serviceFee.toFixed(2);
                        var user_balance = user.finance.balance.toFixed(2);
                        if (user_balance < total) {
                            callback('no enough balance to pay apply:' + apply.serialID);
                        } else {
                            apply.status = 4;
                            Homas.findOne({using:false}, function(err, homas) {
                                if (!err && !homas) {
                                    err = 'failed to assign homas account to apply:' + apply.serialID;
                                }
                                callback(err, true, user, apply, homas, total);
                            });
                        }
                    } else if (apply.status === 2) { // in this case (apply in process, order pay for it), it means the order is for add deposit
                        user.finance.balance -= pay_amount;
                        user.save(function(err) {
                            callback(err, false, null, null, null, null);
                        });
                    }
                } else {
                    callback(null, false, null, null, null, null);
                }
            },
            function(working, user, apply, homas, total, callback) {
                if (working) {
                    homas.using = true;
                    homas.assignAt = Date.now();
                    homas.applySerialID = apply.serialID;
                    homas.save(function(err) {
                        callback(err, true, user, apply, homas, total);
                    });
                } else {
                    callback(null, false, user, apply, homas, total);
                }
            },
            function(working, user, apply, homas, total, callback) {
                if (working) {
                    apply.status = 2;
                    apply.account = homas.account;
                    apply.password = homas.password;
                    var startDay = util.getStartDay();
                    apply.startTime = startDay.toDate();
                    apply.endTime = util.getEndDay(startDay, apply.period).toDate();
                    apply.save(function (err) {
                        callback(err, true, user, total);
                    });
                } else {
                    callback(null, false, user, total);
                }
            },
            function(working, user, total, callback) {
                if (working) {
                    user.finance.balance -= total;
                    user.save(function (err) {
                        callback(err, 'success pay apply');
                    });
                } else {
                    callback(null, 'done');
                }
            }
        ], function(err, result) {
            if (err) {
                logger.error('shengpayFeedback error:' + err.toString());
            } else {
                logger.info('shengpayFeedback result:'+result);
            }
        });
    }
    res.send('OK');
};

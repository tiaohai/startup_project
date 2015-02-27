var passport = require('passport'),
    User = require('../models/User'),
    userViewModel = require('../viewModels/user'),
    nodemailer = require('nodemailer'),
    crypto = require('crypto'),
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
            res.redirect('/user/index');
        });
    });
    auth(req, res, next);
};

module.exports.postSignup = function(req, res, next) {
    req.assert('mobile', '无效的手机号码').len(11, 11).isInt();
    req.assert('password', '密码不能为空').notEmpty();
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
                res.redirect('/user/index');
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
        req.flash('errors', errors);
        return res.redirect('/user/verify_email');
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
                    user: "xxxxxxxx@qq.com",
                    pass: "xxxxxxxx"
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
        if (err) return next(err);
        res.redirect('/user/verify_email');
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

module.exports.getResetPassword = function(req, res) {
    res.render('user/change_pass', {layout:null});
};

module.exports.getUser = function(req, res, next) {
    User.findById(req.params.id, function(err, user) {
        if (err) next(err);
        res.send(user);
    });
};

module.exports.updateUser = function(req, res, next) {
    var userData = req.body;
    User.update({_id:req.params.id}, userData, function (err, numberAffected, raw) {
        if (err) {
            return res.send({success:false, reason:err.toString()});
        }
        res.send({success:true});
    });
};

module.exports.postUpdatePassword = function(req, res, next) {
    //req.assert('password', 'Password must be at least 4 characters long').len(4);
    req.assert('confirm_password', '两次密码不匹配').equals(req.body.password);

    var errors = req.validationErrors();

    if (errors) {
        res.status(400);
        return res.send({success:false, reason:errors});
    }

    User.findById(req.user.id, function(err, user) {
        if (err) return res.send({success: false, reason: err.toString()});
        user.comparePassword(req.body.old_password, function (err, isMatch) {
            if (err) return res.send({success: false, reason: err.toString()});
            if (!isMatch) {
                return res.send({success: false, reason: '无效的旧密码'});
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

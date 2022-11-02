﻿// const { param, use } = require('../routes/RegisterUser');
const User = require('../schemas/user');
var validator = require('validator');
const errorHandler = require('./errorhandler');
const { checkMissingParams, checkLogin, isUserSubscribed } = require('./general');
const bcrypt = require('bcryptjs');
const config = require('../config.json');
var jwt = require('jsonwebtoken');



function firstNameValidator(firstName, res) {
    const length = validator.isByteLength(firstName, { min: 2, max: 20 }) // length should be between 4 and 10
    const regex = validator.matches(firstName, /^[a-zA-Z0-9ğüşöçİıĞÜŞÖÇ]+$/g); // should contains at least 1 char (letter)
    if (!length) new errorHandler(res, 500, 4);
    if (!regex) new errorHandler(res, 500, 5);
    return length && regex;
}

function lastNameValidator(lastName, res) {
    const length = validator.isByteLength(lastName, { min: 2, max: 20 }) // length should be between 4 and 10
    const regex = validator.matches(lastName, /^[a-zA-Z0-9ğüşöçİıĞÜŞÖÇ]+$/g); // should contains at least 1 char (letter)
    if (!length) new errorHandler(res, 500, 6);
    if (!regex) new errorHandler(res, 500, 7);
    return length && regex;
}
function passwordValidator(password, res) {
    const regex = validator.matches(password, /^(?=.*\d)(?=.*[a-z])(?=.*[a-zA-Z]).{8,25}$/g)
    if (!regex) new errorHandler(res, 500, 8);
    return regex;
}
async function emailValidator(email, res) {
    const isEmail = validator.isEmail(email);
    const already = await isEmailAlready(email);

    if (already) new errorHandler(res, 500, 10);
    if (!isEmail) new errorHandler(res, 500, 11);


    return !already && isEmail


}
function CapitalizeString(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLocaleLowerCase()
}

const createJWT = (email, userId) => {
    var JWT = jwt.sign({ email: email, type: 'user', userId: userId }, config.privateKey);
    return JWT;
}


async function isEmailAlready(email) {
    return await User.findOne({ email: email }) ? true : false
}


const registerUser = async (req, res) => {


    if (!req.cookies.token) {
        const params = [
            'firstName',
            'lastName',
            'email',
            'password',
            'country',
            'university',
            'city',
            'phone'
        ];

        if (!checkMissingParams(params, req, res)) return;

        let { firstName, lastName, email, password, city, country, university, phone, lang } = req.body;
        firstName = firstName.trim();
        lastName = lastName.trim();
        email = email.trim();
        firstName = CapitalizeString(firstName);

        lastName = CapitalizeString(lastName);
        email = email.toLowerCase();



        if (
            firstNameValidator(firstName, res) &&
            lastNameValidator(lastName, res) &&
            passwordValidator(password, res) &&
            await emailValidator(email, res)
        ) {

            const newUser = new User({
                firstName,
                lastName,
                email,
                hash: bcrypt.hashSync(password, 12),
                country,
                university,
                city,
                phone,
                lang: lang ? lang : "en"
            });



            await newUser.save(); // Insert to database
            const token = createJWT(email, newUser._id) // Create token
            res.cookie('token', token); // set token to the cookie
            res.status(200).send({ message: "User registered successfully", token: token, user: newUser }) // send response;




        }


    }
    else {
        res.status(500).send({ message: "You are already logged in" });
    }







};


const logOut = async (req, res) => {

    try {
        const token = req.body.token ? req.body.token : req.cookies.token;
        if (token) {
            var result = jwt.verify(token, config.privateKey);
            const user = await User.findOne({ email: result.email });
            global.socketUsers = global.socketUsers.filter(e => e.userId != user._id)
        }
        res.clearCookie('token');
        res.status(202).send({ message: 'Log Outed Successfully' })
    }
    catch (e) {
        res.send("ok");
    }

};
const refreshToken = async (req, res) => {
    try {
        const token = req.body.token ? req.body.token : req.cookies.token;

        if (token) {
            var result = jwt.verify(token, config.privateKey);
            const user = await User.findOne({ email: result.email })


            if (user) {
                res.cookie('token', token);
                res.status(200).send({ user: user })
            }
            else {
                new errorHandler(res, 500, 0)
            }
        }
        else {
            new errorHandler(res, 500, 0)
        }
    }
    catch (e) {
        new errorHandler(res, 500, 0)
    }

}
const login = async (req, res) => {


    if (await checkLogin(req) == false) {
        const { email, password } = req.body;
        const userByEmail = await User.findOne({ email: email });
        if (userByEmail) {
            const comparePassword = await bcrypt.compare(password, userByEmail.hash)
            const token = createJWT(email, userByEmail._id);
            if (comparePassword) {
                res.cookie('token', token); // set token to the cookie
                res.status(200).send({ token: token, user: userByEmail })
            }
            else {
                new errorHandler(res, 500, 13)
            }
        }
        else {
            new errorHandler(res, 404, 13)
        }

    }
    else {
        const user = await checkLogin(req);
        res.status(200).send({ token: req.cookies.token, user: user })
    }



};


const changeUserProfile = async (req, res) => {
    try {
        const getUser = await checkLogin(req)
        if (getUser) { // Admin ise
            const body = req.body;
            const email = req.body.email
            delete body.hash
            const token = req.cookies.token;
            var userResult = jwt.verify(token, config.privateKey);
            const user = getUser;
            if (user) {

                let newToken = token;
                if (userResult.email != email) {
                    newToken = createJWT(email)
                    res.cookie('token', newToken); // set token to the cookie

                }

                await user.updateOne({ ...body });
                const newUser = await User.findById(user._id)

                res.status(200).send({ token: newToken, user: newUser })
            }
            else {
                res.status(500).send({ error: 'error' })
            }


        }
    }
    catch (e) {
        console.log(e)
        // new errorHandler(res, 500, 0)
        res.status(500).send({ error: 'error' })
    }
}

const getUser = async (req, res) => {
    try {
        const user = await checkLogin(req)
        if (user) {
            res.status(200).send({ user: user })
        }
        else {
            res.status(500).send({ error: 'Kullanıcı bulunamadı' })
        }

    }
    catch (e) {
        console.log(e)
        // new errorHandler(res, 500, 0)
        res.status(500).send({ error: 'error' })
    }
}

const changePassword = async (req, res) => {
    // try {
    if (await checkLogin(req)) { // Admin ise
        const { oldPassword, newPassword } = req.body;

        const token = req.cookies.token;
        var userResult = jwt.verify(token, config.privateKey);
        const user = await User.findOne({ email: userResult.email })
        if (user) {
            const comparePassword = await bcrypt.compare(oldPassword, user.hash)
            if (comparePassword) {
                // if old password was correct
                const hash = bcrypt.hashSync(newPassword, 12);
                await user.updateOne({ hash });
                const newUser = await User.findById(user._id)

                res.status(200).send({ user: newUser })
            }
            else {
                res.status(500).send({ error: "Eski şifre doğru değil" })
            }



        }
        else {
            res.status(500).send({ error: 'error user not found' })
        }


    }
    // }
    // catch (e) {
    //     console.log(e)
    //     // new errorHandler(res, 500, 0)
    //     res.status(500).send({ error: 'error', e: e })
    // }
}

const getUserPrice = async (priceId) => {
    try {
        if (priceId) {
            const userPrice = await Prices.findById(priceId);
            return userPrice;
        }
        else {
            return null;
        }
    }
    catch (e) {

        return null;
    }


}

const _isUserSubscribed = async (req, res) => {

    const getUser = await checkLogin(req);
    if (!getUser) {
        return res.send({ status: false })
    }
    else {
        const status = isUserSubscribed(getUser)
        return res.send({ status: status })
    }


}

const sendMail = async (req, res) => {
    const { email, title, content } = req.body;
    const mailjet = require('node-mailjet')
        .connect('f1eea4906be660d06590659d8f738d71', '21e8ad4bf8a2eff76dd2f34169ea7ed9')
    const request = mailjet
        .post("send", { 'version': 'v3.1' })
        .request({
            "Messages": [
                {
                    "From": {
                        "Email": "maze.software.mail.sender@gmail.com",
                        "Name": "Cuzdan App"
                    },
                    "To": [
                        {
                            "Email": config.mailAdress,
                            "Name": "Maze Software Mail Sender : Cuzdan App"
                        }
                    ],
                    "Subject": "Kullanıcınız Yeni Mesajınız Var",
                    "TextPart": "Kullanıcıdan yeni mseajınız var",
                    "HTMLPart": "<strong> Email: </strong>" + email + " adlı kullanıcıdan mesaj var. <br><strong> Title: </strong>" + title + "<br> <strong> Message: </strong>" + content
                }
            ]
        })
    request
        .then((result) => {
            // console.log(result.body)
            res.send("ok")
        })
        .catch((err) => {
            res.send("fail")
            console.log(err.statusCode)
        })



}

const forgetPassword = async (req, res) => {
    let { email } = req.body;
    const newPassword = generateRandomPassword(10);


    let user = await User.findOne({ email: email });
    if (!user) user = await User.findOne({ username: email })
    if (user) {
        email = user.email
    }
    if (!user) return res.status(500).send("kullanıcı bulunamadı")
    await user.updateOne({ hash: bcrypt.hashSync(newPassword, 12) })

    if (user) {


        const mailjet = require('node-mailjet')
            .connect('f1eea4906be660d06590659d8f738d71', '21e8ad4bf8a2eff76dd2f34169ea7ed9')
        const request = mailjet
            .post("send", { 'version': 'v3.1' })
            .request({
                "Messages": [
                    {
                        "From": {
                            "Email": "maze.software.mail.sender@gmail.com",
                            "Name": "Cuzdan App"
                        },
                        "To": [
                            {
                                "Email": email,
                                "Name": "User"
                            }
                        ],
                        "Subject": "Şifre sıfırlama isteği",
                        "TextPart": "Şifre sıfırlama isteği gönderdiniz.",
                        "HTMLPart": "Şifre sıfırlama isteğiniz başarlı. <br><br><strong> Yeni şifreniz: </strong>" + newPassword
                    }
                ]
            })
        request
            .then((result) => {
                // console.log(result.body)
                res.send("ok")
            })
            .catch((err) => {
                res.send("fail")
                console.log(err.statusCode)
            })

    }






}

function generateRandomPassword(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


const controlPrevPayment = async (user, res = null) => {

    const filterDate = new Date();
    filterDate.setMinutes(filterDate.getMinutes() - 7200);


    const paidBefore = await Payments.findOne({ userId: user._id, isPaid: false, date: { $gt: filterDate } }).sort({ date: -1 })
    if (paidBefore) {
        const paymentStatus = await getPaymentStatus(paidBefore.paymentId);

        if (paymentStatus) {
            await activateUserSubscription(paidBefore.paymentId, res);
            return true;
        }
        else {
            // silebiliriz paymenti
            await Payments.findByIdAndRemove(paidBefore._id);
            return false;
        }
    }

}

const paymentForm = async (req, res) => {



    const currencies = [
        "RUR",
        "USD",
        "EUR",
        "KZT"
    ];

    if (config.appstoreReview) {
        res.send("Payment is disabled, We are working on app store in-app purchases system");
        return;
    }
    const { userToken, priceId } = req.body;

    if (!userToken || !priceId) {
        res.send("userToken or price null");
        return;
    }
    const getProduct = await Prices.findById(priceId);
    const result = jwt.verify(userToken, config.privateKey);
    const user = await User.findOne({ email: result.email })
    const lang = user.lang
    // console.log("Product", getProduct)

    if (!user || !getProduct) {
        res.send("Error, couldn't access user token or product information")
        return "";
    }




    const pg_merchant_id = "538933";
    const secret_key = "YbKQc0mq9t9GB0fb";
    const url = "https://api.paybox.money/init_payment.php";
    var md5 = require('md5');
    const order_id = Math.random().toString(36).substr(2, 9)
    let request = [
        url.split('/').pop(),
        { pg_merchant_id: pg_merchant_id },
        { pg_amount: getProduct.price },
        { pg_currency: currencies.includes(getProduct.currency.toUpperCase()) ? getProduct.currency.toUpperCase() : 'kgs' },
        { pg_description: getProduct.priceContent + "   description" },
        { pg_salt: "LM9RhvtI3CNw3CoC" },
        { pg_language: getProduct.lang },
        { pg_order_id: order_id },
        { pg_success_url: 'https://patris.mazedev.online/api/user/paymentcallback' },
        // { pg_success_url: 'https://' + req.get('host') + '/api/user/paymentcallback' }

    ];

    request.sort(function (a, b) {
        var keyA = Object.keys(a)[0],
            keyB = Object.keys(b)[0];
        // Compare
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
    });

    request.push(secret_key)
    const finish = request.map((e) => {
        if (typeof e == 'object') {
            return e[Object.keys(e)[0]]
        }
        else {
            return e
        }
    });

    //init;100;1234;Описание платежа;538933;12345;some random string;1234;0ZOznEKNn2CrNYLY
    const md5hash = md5(finish.join(";"));
    request = request.filter(e => typeof e == 'object');
    request.push({ pg_sig: md5hash })
    const requestObj = {};
    request.forEach(obj => {
        requestObj[Object.keys(obj)] = obj[Object.keys(obj)]
    })


    // //POST ATMA

    const axios = require("axios");
    const res2 = await axios.default.get(url, {
        // ...requestObj
        params: {
            ...requestObj
        }
    });
    var parser = require('xml2json');
    // xml to json
    var json = parser.toJson(res2.data, { object: true });
    // console.log(json);
    const cutomer_id = json.response.pg_redirect_url.split("/").pop().substring(18)


    const payment = new Payments({
        userId: user._id,
        iyziCoToken: "TOKEN YOK",
        customerId: cutomer_id,
        paymentId: json.response.pg_payment_id,
        amount: getProduct.price,
        subscriptionType: getProduct.month,
        date: new Date(),
        isPaid: false,
        priceId: getProduct._id
    })
    await payment.save();
    res.send(`<script>window.location = '${json.response.pg_redirect_url}' </script><a href='${json.response.pg_redirect_url}'>Continue</a>`)





}

const activateUserSubscription = async (paymentId, res = null) => {

    const findPayment = await Payments.findOne({ paymentId: paymentId })

    const user = await User.findById(findPayment.userId)
    // console.log(user)
    if (user) {
        const newPayment = await findPayment.updateOne({ isPaid: true })
        const newDate = new Date();
        const subscriptionEndDate = newDate.setMonth(newDate.getMonth() + findPayment.subscriptionType)
        await user.updateOne({ subscription: true, subscriptionEndDate: subscriptionEndDate, priceId: findPayment.priceId })
        if (res) res.status(200).send("Payment is successful")
    }
    else {
        if (res) res.send("Error occoured while payment")
    }

}

var base64 = require('base-64');
var crypto = require('crypto');
const paymentCallBack = async (req, res) => {


    // console.log(req.body)
    activateUserSubscription(req.body.pg_payment_id, res)
    // pg_order_id: 'lnytlnw3i',
    // pg_payment_id: '482861159',
    // pg_salt: '4F3MfALcBWKwJQrm',
    // pg_sig: 'b9a6b76b52d13b99c43dea6fc0050c7b'

}




// const paymentForm = async (req, res) => {
//     if (config.appstoreReview) {
//         res.send("Payment is disabled, We are working on app store in-app purchases system");
//         return;
//     }
//     const { userToken, priceId } = req.body;
//     if (!userToken || !priceId) {
//         res.send("userToken or price null");
//         return;
//     }
//     const getProduct = await Prices.findById(priceId);
//     const result = jwt.verify(userToken, config.privateKey);
//     const user = await User.findOne({ email: result.email })
//     const lang = user.lang


//     if (!user || !getProduct) {
//         res.send("Error, couldn't access user token or product information")
//         return "";
//     }

//     const langText = {
//         tr: {
//             continue: "Devam",
//             emailText: "Ödeme işleme sırasında lütfen emailinizi ve adınızı kayıtlı olduğunuz email adresi ve adınız şeklinde yazın aksi takdirde, ödemeniz geçersiz sayılır. Ödeme yaptıkdan sonra uygulamayı yeniden başlatmayı unutmayın !"
//         },
//         en: {
//             continue: "Continue",
//             emailText: "During the payment processing, please write your email and name as your registered e-mail address and your name, otherwise your payment will be deemed invalid. Don't forget to restart the app after your payment !"
//         },
//         per:
//         {
//             continue: "ادامه هید",
//             emailText: "فراموش نکنید که برنامه را پس از پرداخت دوباره راه اندازی کنید! در هنگام پردازش پرداخت ، لطفاً ایمیل و نام خود را به عنوان آدرس پست الکترونیکی ثبت شده و نام خود بنویسید ، در غیر این صورت پرداخت شما نامعتبر شناخته می شود.",

//         },
//         ru: {
//             continue: "Продолжать",
//             emailText: "Во время обработки платежа укажите свой адрес электронной почты и имя в качестве зарегистрированного адреса электронной почты и свое имя, иначе ваш платеж будет считаться недействительным. Не забудьте перезапустить приложение после оплаты!",

//         }

//     }
//     res.status(200).send(`
//     <!doctype html>
//     <html lang="en">
//       <head>
//         <!-- Required meta tags -->
//         <meta charset="utf-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1">

//         <!-- Bootstrap CSS -->
//         <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-eOJMYsd53ii+scO/bJGFsiCZc+5NDVN2yr8+0RDqr0Ql0h+rP48ckxlpbzKgwra6" crossorigin="anonymous">

//         <title>Payment</title>
//       </head>
//       <body>

//        <p>${langText[lang].emailText}</p>
//        <p>email:${user.email}</p>
//        <a href="https://shopier.com/${getProduct.shopierId}" type="button" class="btn btn-primary">${langText[lang].continue}</a>

//         <!-- Optional JavaScript; choose one of the two! -->

//         <!-- Option 1: Bootstrap Bundle with Popper -->
//         <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta3/dist/js/bootstrap.bundle.min.js" integrity="sha384-JEW9xMcG8R+pH31jmWH6WWP0WintQrMb4s7ZOdauHnUtxwoG2vI5DkLtS3qm9Ekf" crossorigin="anonymous"></script>

//         <!-- Option 2: Separate Popper and Bootstrap JS -->
//         <!--
//         <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.9.1/dist/umd/popper.min.js" integrity="sha384-SR1sx49pcuLnqZUnnPwx6FCym0wLsk5JZuNx2bPPENzswTNFaQU1RDvt3wT4gWFG" crossorigin="anonymous"></script>
//         <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta3/dist/js/bootstrap.min.js" integrity="sha384-j0CNLUeiqtyaRmlzUHCPZ+Gy5fQu0dQ6eZ/xAww941Ai1SxSY+0EQqNXNE6DZiVc" crossorigin="anonymous"></script>
//         -->
//         <style>
//             body{display: flex;
//                 justify-content: center;
//                 align-items: center;
//                 flex-direction: column;
//                 padding: 40px;}
//         </style/>
//       </body>
//     </html>
//     `)
// }
// var base64 = require('base-64');
// var crypto = require('crypto');
// const paymentCallBack = async (req, res) => {
//     const osbUsername = "623117c770a29cbfd0215f36982c47f3";
//     const osbKey = "38caad28030506a21923e985ab268cc4";


//     if (req.body.res && req.body.hash) {
//         const content = JSON.parse(base64.decode(req.body.res)) // 0..TL, 1..USD, 2...EUR
//         const email = content.email
//         const productId = content.productid
//         const orderId = content.orderid
//         const user = await User.findOne({ email: email })
//         if (!user) {
//             res.send("Your email is not registered. Please send ticket to us with this order numer : " + content.orderid + " email:" + content.email + " product id : " + productId)
//             return "";
//         }
//         const getProduct = await Prices.findOne({ shopierId: productId })
//         if (!getProduct) {
//             res.send("Product is not found. Please send ticket to us with this order numer : " + content.orderid + " email:" + content.email + " product id : " + productId)
//             return "";
//         }

//         const newDate = new Date();
//         const subscriptionEndDate = newDate.setMonth(newDate.getMonth() + getProduct.month)
//         await user.updateOne({ subscription: true, subscriptionEndDate: subscriptionEndDate, priceId: getProduct._id })
//         res.status(200).send(`
//         Payment is successful. Please restart the app ! /n
//         Ödeme başarılı. Lütfen Uygulamayı Yeniden Başlatın ! /n
//         Оплата прошла успешно. Пожалуйста, перезапустите приложение!
//         پرداخت موفقیت آمیز است. لطفاً برنامه را مجدداً راه اندازی کنید!`)





//     }




// }


const paymentFormIYZICO = async (req, res) => {

    if (config.appstoreReview) {
        res.send("Payment is disabled, We are working on app store in-app purchases system");
        return;
    }

    // try {
    const { userToken, priceId } = req.body;
    const getPrice = await Prices.findById(priceId);

    const result = jwt.verify(userToken, config.privateKey);
    const paidPrice = getPrice.price;
    const user = await User.findOne({ email: result.email })
    let currency;
    switch (getPrice.currency) {
        case "TR": currency = Iyzipay.CURRENCY.TRY; break;
        case "USD": currency = Iyzipay.CURRENCY.USD; break;
        case "EUR": currency = Iyzipay.CURRENCY.EUR; break;
        case "RUB": currency = Iyzipay.CURRENCY.RUB; break;
        case "GBP": currency = Iyzipay.CURRENCY.GBP; break;
        case "IRR": currency = Iyzipay.CURRENCY.IRR; break;
        case "NOK": currency = Iyzipay.CURRENCY.NOK; break;
        case "CHF": currency = Iyzipay.CURRENCY.CHF; break;
        default: currency = Iyzipay.CURRENCY.TRY; break;
    }


    var request = {
        locale: Iyzipay.LOCALE.EN,
        conversationId: "canerkocas06@gmail.com",
        price: Number(paidPrice),
        paidPrice: paidPrice,
        currency: currency,
        basketId: 'B67832',
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        callbackUrl: 'https://' + req.get('host') + '/api/user/paymentcallback',
        enabledInstallments: [2, 3, 6, 9],
        buyer: {
            id: "123456789",
            name: user.firstName,
            surname: user.lastName,
            gsmNumber: '+905350000000',
            email: user.email,
            identityNumber: '74300864791',
            lastLoginDate: '2015-10-05 12:43:35',
            registrationDate: '2013-04-21 15:12:09',
            registrationAddress: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
            ip: '85.34.78.112',
            city: 'Istanbul',
            country: 'Turkey',
            zipCode: '34732'
        },
        shippingAddress: {
            contactName: 'Jane Doe',
            city: 'Istanbul',
            country: 'Turkey',
            address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
            zipCode: '34742'
        },
        billingAddress: {
            contactName: 'Jane Doe',
            city: 'Istanbul',
            country: 'Turkey',
            address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
            zipCode: '34742'
        },
        basketItems: [
            {
                id: 'BI101',
                name: 'Binocular',
                category1: 'Collectibles',
                category2: 'Accessories',
                itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
                price: paidPrice
            }
        ]
    };
    iyzipay.checkoutFormInitialize.create(request, async function (err, result) {
        // console.log(err, result);
        const iyzicoToken = result.token;

        const createPayment = new Payments({
            userId: user._id,
            iyziCoToken: iyzicoToken,
            amount: paidPrice,
            subscriptionType: getPrice.month,
            date: new Date(),
            isPaid: false,
            priceId: priceId
        })
        await createPayment.save();
        if (result.status == 'success') {
            res.send(`
            <html>
            <head>
    <meta charset="UTF-8">
    <title>iyzico Payment Page</title>

    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="">
    <meta name="author" content="iyzico team">
    <link rel="icon" href="/img/favicon.ico">

       <body style="margin:0">
            
            <iframe src="${result.paymentPageUrl}&iframe=true" style="width:100%;height:100%;border:0" allowfullscreen></iframe><body>
            
            </html>
            `)

        }
        else {
            res.send(result)
        }

    });

    // }
    // catch (e) {
    //     new errorHandler(res, 500, 1);
    // }

}

const paymentCallBackIYZICO = async (req, res) => {



    iyzipay.checkoutForm.retrieve({
        locale: Iyzipay.LOCALE.TR,
        token: req.body.token
    }, async function (err, result) {
        // console.log(err, result);
        if (result.status == 'success') {

            // Payment Successful
            // try {

            const findPayment = await Payments.findOne({ iyziCoToken: req.body.token })

            const user = await User.findById(findPayment.userId)
            if (user) {

                const newPayment = await findPayment.updateOne({ isPaid: true })
                const newDate = new Date();
                const subscriptionEndDate = newDate.setMonth(newDate.getMonth() + findPayment.subscriptionType)
                await user.updateOne({ subscription: true, subscriptionEndDate: subscriptionEndDate, priceId: findPayment.priceId })
                res.status(200).send("Payment is successful")
            }

            // }
            // catch (e) {

            //     res.send("Error happened")
            //     console.log(e)
            // }






        }
        else {

            res.send("Error occoured while payment, " + err.errorMessage)
        }
    });


}
const getSuggestedVideos = async (req, res) => {
    // try {

    const token = req.cookies.token;
    if (token) {
        var userResult = jwt.verify(token, config.privateKey);
        const user = await User.findOne({ email: userResult.email })
        if (user) {

            let userSubscripton = false;
            let userAccessVideos = [];

            let subscriptionEndDate = new Date(user.subscriptionEndDate).getTime();
            let nowDate = new Date().getTime();

            if (nowDate < subscriptionEndDate) {
                userSubscripton = true;
                const price = await getUserPrice(user.priceId)
                if (price) {
                    userAccessVideos = price.videos
                }

            }



            let returnList = [];
            let { lang } = req.body;
            if (!lang) lang = "en";


            const getCategory = await Category.find({ lang: lang }).lean();
            for (var i = 0; i < getCategory.length; i++) {
                let videos = await Video.find({ categoryId: getCategory[i]._id }).limit(4).lean();
                for (var q = 0; q < videos.length; q++) {
                    const currentVideo = videos[q];
                    currentVideo.lock = true;


                    if (currentVideo.freeTrial) {
                        currentVideo.lock = false;
                    }
                    else if (userAccessVideos.includes(currentVideo._id)) {
                        currentVideo.lock = false;
                    }

                    if (currentVideo.lock == true) // güvenlik
                    {
                        currentVideo.videoSource = "";
                    }


                    videos[q].category = getCategory[i];
                }

                returnList = videos;
            }


            for (var x = 0; x < returnList.length; x++) {
                returnList[x].videoparts = await VideoPart.find({ videoId: returnList[x]._id }).lean();
            }


            res.send({ data: returnList })
        }
    }
    else {
        new errorHandler(res, 500, 0);
    }
    // }
    // catch (e) {
    //     new errorHandler(res, 500, 1);
    //     console.log(e)
    // }




}


const getScreenShotRemains = async (req, res) => {
    const AttemptLeftDefault = 5;
    // try {
    const { email } = req.body;
    const findUserInList = await ScreenShot.exists({ email: email });

    if (findUserInList) {
        const getUserFromList = await ScreenShot.findOne({ email: email })
        res.send({ count: getUserFromList.attemptLeft })
    }
    else {
        res.send({ count: AttemptLeftDefault })
    }
    // }
    // catch (e) {

    // }
}
const takeScreenShot = async (req, res) => {
    const AttemptLeftDefault = 5;
    // try {
    const { email } = req.body;
    if (email) {
        const findUserInList = await ScreenShot.exists({ email: email })
        if (findUserInList) {
            const getUserFromList = await ScreenShot.findOne({ email: email })
            // update

            await ScreenShot.updateOne({ email: email }, { attemptLeft: Number(getUserFromList.attemptLeft) - 1 });


            if (Number(getUserFromList.attemptLeft) - 1 < 1) {
                // cancel the subscription
                // Üyeliği İptal Et

                await User.findOneAndUpdate({ email: email }, { subscriptionEndDate: Date.now(), subscription: false })


            }

            res.send({ count: Number(getUserFromList.attemptLeft) - 1 })

        }
        else {
            // add new
            const newScreenShot = new ScreenShot({
                email: email,
                attemptLeft: AttemptLeftDefault - 1
            });
            await newScreenShot.save();
            res.send({ count: AttemptLeftDefault - 1 })
        }

    }
    // }
    // catch (e) {

    // }
}


const termsAndCondition = (req, res) => {
    res.send("yok")
}

module.exports = {
    termsAndCondition,
    getScreenShotRemains,
    takeScreenShot,
    registerUser,
    getUser,
    logOut, login,
    refreshToken, changeUserProfile, _isUserSubscribed, changePassword, sendMail, forgetPassword, paymentForm, paymentCallBack, getSuggestedVideos
};

const express = require('express');
const router = express.Router();
const axios = require('axios');

module.exports = function (_auth){
    auth = _auth;

    router.get('/', async function(req, res, next) {
        if(req.session.user){
            res.redirect('/checkout/complete')
        }
        else {
            res.render('checkout');
        }
    });

    router.get('/guest',function(req, res, next) {
        res.render('checkout-guest');
    });

    router.post('/guest/complete', async function(req, res, next) {
        try{
            var orderID = (Math.floor(Math.random() * 100000) + 1000).toString();
            var payload = {
                profile: {
                    email: req.body.email,
                    login: req.body.email,
                    orderID: orderID
                },
                credentials: {
                    password: {value: orderID}
                },
                groupIds: [process.env.ANON_USER_GROUP],
                type: {
                    id: process.env.ANON_USER_TYPE_ID
                }
            }
            var register = await axios.post(process.env.TENANT_URL + 
                '/api/v1/users/',payload)

            var authNresponse = await axios.post(process.env.TENANT_URL + 
                '/api/v1/authn',{
                    "username": req.body.email,
                    "password": orderID
                },{
                'x-forwarded-for': req.headers['x-forwarded-for'] || req.connection.remoteAddress
            })

            req.session.sessionID = authNresponse.data.sessionToken
            res.redirect('/checkout/complete')           
        } catch(err){
            console.log(err)
            // set locals, only providing error in development
            res.locals.message = err.message;
            res.locals.error = req.app.get('env') === 'development' ? err : {};
      
            // render the error page
            res.status(err.status || 500);
            res.render('error', { title: 'Error' });
        }
    });

    router.get('/new-user',function(req, res, next) {
        res.render('checkout-new-user');
    });

    router.post('/new-user/complete', async function(req, res, next) {
        try{
            var payload = {
                profile: {
                    email: req.body.email,
                    login: req.body.email,
                    firstName: req.body.firstName,
                    lastName: req.body.lastName
                },
                credentials: {
                    password: {value: req.body.password}
                }
            }
            await axios.post(process.env.TENANT_URL + 
                '/api/v1/users/',payload)

            var authNresponse = await axios.post(process.env.TENANT_URL + 
                '/api/v1/authn',{
                    "username": req.body.email,
                    "password": req.body.password
                },{
                'x-forwarded-for': req.headers['x-forwarded-for'] || req.connection.remoteAddress
            })

            req.session.sessionID = authNresponse.data.sessionToken
            res.redirect('/checkout/complete')           
        } catch(err){
            console.log(err)
            // set locals, only providing error in development
            res.locals.message = err.message;
            res.locals.error = req.app.get('env') === 'development' ? err : {};
      
            // render the error page
            res.status(err.status || 500);
            res.render('error', { title: 'Error' });
        }
    });

    router.get('/existing-user',function(req, res, next) {
        res.render('checkout-existing-user');
    });

    router.post('/existing-user/complete', async function(req, res, next) {
        try{
            var authNresponse = await axios.post(process.env.TENANT_URL + 
                '/api/v1/authn',{
                    "username": req.body.email,
                    "password": req.body.password
                },{
                'x-forwarded-for': req.headers['x-forwarded-for'] || req.connection.remoteAddress
            })
            //TODO handle mfa challenges here
            req.session.sessionID = authNresponse.data.sessionToken
            res.redirect('/checkout/complete')           
        } catch(err){
            console.log(err)
            // set locals, only providing error in development
            res.locals.message = err.message;
            res.locals.error = req.app.get('env') === 'development' ? err : {};
      
            // render the error page
            res.status(err.status || 500);
            res.render('error', { title: 'Error' });
        }
    });

    router.get('/facebook',function(req, res, next) {
        req.session.idp = process.env.FACEBOOK_IDP_ID
        res.redirect('/checkout/complete')  
    });

    router.get('/complete',auth.ensureAuthenticated(), async function(req, res, next) {
        res.render('complete',{accessToken: req.session.user.access_token});
    });

  return router;
}

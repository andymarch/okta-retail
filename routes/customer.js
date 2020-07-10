const express = require('express');
const router = express.Router();
const axios = require('axios');

module.exports = function (_auth){
    auth = _auth;

    router.get('/',function(req, res, next) {
        res.render('customer');
    });

    router.get('/guest',function(req, res, next) {
        res.render('customer-guest');
    });

    router.get('/guest/continue', async function(req, res, next) {
        try{
            var orderID = (Math.floor(Math.random() * 100000) + 1000).toString();
            var payload = {
                profile: {
                    orderID: orderID
                },
                credentials: {
                    password: {value: orderID}
                }
            }
            await axios.post(process.env.TENANT_URL + 
                '/api/v1/users/'+req.query.id,payload)

            var authNresponse = await axios.post(process.env.TENANT_URL + 
                '/api/v1/authn',{
                    "username": req.query.id,
                    "password": orderID
                },{
                'x-forwarded-for': req.headers['x-forwarded-for'] || req.connection.remoteAddress
            })

            req.session.sessionID = authNresponse.data.sessionToken
            res.redirect("/authorize")         
        } catch(err){

            if(err.response.data.errorSummary ==="Api validation failed: login"){
                res.redirect('/customer/returning?id='+encodeURIComponent(req.body.email))
            }
            else {
                console.log(err)
                // set locals, only providing error in development
                res.locals.message = err.message;
                res.locals.error = req.app.get('env') === 'development' ? err : {};
        
                // render the error page
                res.status(err.status || 500);
                res.render('error', { title: 'Error' });
            }
        }
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
            res.redirect("/authorize")         
        } catch(err){

            if(err.response.data.errorSummary ==="Api validation failed: login"){
                res.redirect('/customer/returning?id='+encodeURIComponent(req.body.email))
            }
            else {
                console.log(err)
                // set locals, only providing error in development
                res.locals.message = err.message;
                res.locals.error = req.app.get('env') === 'development' ? err : {};
        
                // render the error page
                res.status(err.status || 500);
                res.render('error', { title: 'Error' });
            }
        }
    });

    router.get('/returning',async function(req, res, next) {
        var response = await axios.get(process.env.TENANT_URL + 
            '/api/v1/users/'+req.query.id)
            console.log(response.data)
        if(response.data.type.id != process.env.ANON_USER_TYPE_ID){
            res.redirect('/customer/existing?id='+req.query.id)
        }
        else{
            res.render('customer-returning', {email:req.query.id}) 
        }
    });

    router.get('/new',function(req, res, next) {
        res.render('customer-new',{id: req.query.id});
    });

    router.post('/new/complete', async function(req, res, next) {
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
            res.redirect("/authorize")         
        } catch(err){
            if(err.response.data.errorSummary ==="Api validation failed: login"){
                var response = await axios.get(process.env.TENANT_URL + 
                    '/api/v1/users/'+req.body.email)

                if(response.data.type.id === process.env.ANON_USER_TYPE_ID){
                    
                    try{
                        console.log("Converting anon")
                        await axios.delete(process.env.TENANT_URL+'/api/v1/groups/'+process.env.ANON_USER_GROUP+'/users/'+response.data.id)
                        console.log("removed group")
                        var payload = {
                            profile: {
                                email: req.body.email,
                                login: req.body.email,
                                firstName: req.body.firstName,
                                lastName: req.body.lastName
                            },
                            credentials: {
                                password: {value: req.body.password}
                            },
                            type: {
                                id: process.env.USER_TYPE_ID
                            }
                        }
                        await axios.put(process.env.TENANT_URL + 
                            '/api/v1/users/'+response.data.id,payload)
            
                        var authNresponse = await axios.post(process.env.TENANT_URL + 
                            '/api/v1/authn',{
                                "username": req.body.email,
                                "password": req.body.password
                            },{
                            'x-forwarded-for': req.headers['x-forwarded-for'] || req.connection.remoteAddress
                        })
            
                        req.session.sessionID = authNresponse.data.sessionToken
                        res.redirect("/authorize")      
                    } catch(err){
                        console.log(err)
                        // set locals, only providing error in development
                        res.locals.message = err.message;
                        res.locals.error = req.app.get('env') === 'development' ? err : {};
                
                        // render the error page
                        res.status(err.status || 500);
                        res.render('error', { title: 'Error' });
                    }   
                }
            }
            console.log(err)
            // set locals, only providing error in development
            res.locals.message = err.message;
            res.locals.error = req.app.get('env') === 'development' ? err : {};
    
            // render the error page
            res.status(err.status || 500);
            res.render('error', { title: 'Error' });
        }
    });

    router.get('/existing',function(req, res, next) {
        res.render('customer-existing',{id: req.query.id});
    });

    router.post('/existing/progress', async function(req, res, next) {
        try{
            var authNresponse = await axios.post(process.env.TENANT_URL + 
                '/api/v1/authn',{
                    "username": req.body.email,
                },{
                'x-forwarded-for': req.headers['x-forwarded-for'] || req.connection.remoteAddress
            })
            //TODO handle mfa challenges here
            req.session.stateToken = authNresponse.data.stateToken
            req.session.factors = authNresponse.data._embedded.factors
            res.redirect("/customer/existing/authenticate")          
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

    router.get('/existing/authenticate',function(req, res, next) {
        var sms
        var password
        req.session.factors.forEach(element => {
            if(element.factorType === "sms"){
                req.session.sms = element
                sms = true
            } else if (element.factorType === "password"){
                req.session.password = element
                password = true
            }
        });
        res.render('customer-existing-auth',{id: req.query.id, password: password, sms: sms});
    });

    router.post('/existing/authenticate/password',async function(req, res, next) {

        var authNresponse = await axios.post(process.env.TENANT_URL + 
            '/api/v1/authn/factors/password/verify',{
                "password": req.body.password,
                "stateToken": req.session.stateToken
            },{
            'x-forwarded-for': req.headers['x-forwarded-for'] || req.connection.remoteAddress
        })

        req.session.factors = undefined
        req.session.password = undefined
        req.session.sms = undefined
        req.session.stateToken = undefined

        req.session.sessionID = authNresponse.data.sessionToken
        res.redirect("/authorize") 
    });

    router.get('/existing/authenticate/sms',async function(req, res, next) {

        var authNresponse = await axios.post(process.env.TENANT_URL + 
            '/api/v1/authn/factors/'+req.session.sms.id+'/verify',{
                "passcode": "",
                "stateToken": req.session.stateToken
            },{
            'x-forwarded-for': req.headers['x-forwarded-for'] || req.connection.remoteAddress
        })

        req.session.stateToken = authNresponse.data.stateToken
        res.render('customer-existing-sms',{number: req.session.sms.profile.phoneNumber})
    });

    router.post('/existing/authenticate/sms',async function(req, res, next) {

            var authNresponse = await axios.post(process.env.TENANT_URL + 
                '/api/v1/authn/factors/'+req.session.sms.id+'/verify',{
                    "password": req.body.password,
                    "stateToken": req.session.stateToken
                },{
                'x-forwarded-for': req.headers['x-forwarded-for'] || req.connection.remoteAddress
            })

        req.session.factors = undefined
        req.session.password = undefined
        req.session.sms = undefined
        req.session.stateToken = undefined

        req.session.sessionID = authNresponse.data.sessionToken
        res.redirect("/authorize") 
    });

    router.post('/existing/complete', async function(req, res, next) {
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
            res.redirect("/authorize")          
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
        res.redirect("/authorize") 
    });

return router;
}
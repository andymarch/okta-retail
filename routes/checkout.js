const express = require('express');
const router = express.Router();
const axios = require('axios');

module.exports = function (_auth){
    auth = _auth;

    router.get('/', auth.ensureAuthenticated(), async function(req, res, next) {
        res.redirect('/checkout/complete')
    });

    router.get('/complete',auth.ensureAuthenticated(), async function(req, res, next) {
        res.render('complete',{accessToken: req.session.user.access_token});
    });

  return router;
}

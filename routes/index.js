const express = require('express');
const router = express.Router();
const axios = require('axios');

module.exports = function (_auth){
    auth = _auth;

  router.get('/', auth.testRemoteSession(), function(req, res, next) {
    res.render('index');
  });

  router.get("/logout", (req, res) => {

    if(req.userContext){
      let protocol = "http"
      if(req.secure){
          protocol = "https"
      }
      else if(req.get('x-forwarded-proto')){
          protocol = req.get('x-forwarded-proto').split(",")[0]
      }
      const tokenSet = req.userContext.tokens;
      const id_token_hint = tokenSet.id_token
      req.session.destroy();
      if(id_token_hint){
        res.redirect(process.env.ISSUER+'/v1/logout?id_token_hint='
            + id_token_hint
            + '&post_logout_redirect_uri='
            + encodeURI(protocol+"://"+req.headers.host)
            );
      }
      else{
        res.redirect("/")
      }
    }
    else {
      res.redirect("/")
    }
  });

  return router;
}

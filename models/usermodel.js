var atob = require('atob');

class UserModel {
    constructor(context) {
        if(context.userinfo || context.tokens){
            this.sub = context.userinfo.sub
            this.givenName = context.userinfo.givenName
            this.familyName = context.userinfo.familyName
        }
    }
}

module.exports = UserModel
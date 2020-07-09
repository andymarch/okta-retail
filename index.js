require('dotenv').config()

const express = require('express')
const hbs  = require('express-handlebars')
const session = require('express-session')
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const axios = require('axios')
var auth = require('./auth.js')
const UserModel = require('./models/usermodel')

const PORT = process.env.PORT || 3000;

var app = express();

app.engine('hbs',  hbs( { 
    extname: 'hbs', 
    defaultLayout: 'base', 
    layoutsDir: __dirname + '/views/layouts/',
    partialsDir: __dirname + '/views/partials/',
    helpers: {
      json: function(json){
        return JSON.stringify(json, undefined, '\t');
      },
      jwt: function (token){
        var atob = require('atob');
        if (token != null) {
            var base64Url = token.split('.')[1];
            var base64 = base64Url.replace('-', '+').replace('_', '/');
            return JSON.stringify(JSON.parse(atob(base64)), undefined, '\t');
        } else {
            return "Invalid or empty token was parsed"
        }
    },
      select: function (value, options){
        return options.fn(this).replace(
          new RegExp(' value=\"' + value + '\"'),
          '$& selected="selected"');
      },
      ifCond: function (v1, operator, v2, options) {
        switch (operator) {
            case '==':
                return (v1 == v2) ? options.fn(this) : options.inverse(this);
            case '===':
                return (v1 === v2) ? options.fn(this) : options.inverse(this);
            case '!=':
                return (v1 != v2) ? options.fn(this) : options.inverse(this);
            case '!==':
                return (v1 !== v2) ? options.fn(this) : options.inverse(this);
            case '<':
                return (v1 < v2) ? options.fn(this) : options.inverse(this);
            case '<=':
                return (v1 <= v2) ? options.fn(this) : options.inverse(this);
            case '>':
                return (v1 > v2) ? options.fn(this) : options.inverse(this);
            case '>=':
                return (v1 >= v2) ? options.fn(this) : options.inverse(this);
            case '&&':
                return (v1 && v2) ? options.fn(this) : options.inverse(this);
            case '||':
                return (v1 || v2) ? options.fn(this) : options.inverse(this);
            default:
                return options.inverse(this);
        }
      },
  }
  } ) );
app.set('view engine', 'hbs');
app.use('/static', express.static('static'));
app.use('/pages-apps-homepage', express.static(__dirname + '/static/pages-apps-homepage'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// session support is required to use ExpressOIDC
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: {secure: false}
}));  

var auth = new auth();
app.use(auth.setContext)
app.use('/login',auth.handleAuthorize)
app.use('/authorization-code/callback',auth.handleCallback)

app.use(async function (req,res,next){
    if(req.userContext){
        res.locals.user = new UserModel(req.userContext)
    }
    next();
})

var indexRouter = require('./routes/index')(auth)
var checkoutRouter = require('./routes/checkout')(auth)
app.use('/', indexRouter)
app.use('/checkout', checkoutRouter)

  
app.use(function(req, res, next) {
    next(createError(404));
});
  
// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error', { title: 'Error' });
});

axios.interceptors.request.use(request => {
    //use this rather than defaul so we only send our API key to the tenant
    if(request.url.startsWith(process.env.TENANT_URL+'/api')){
        request.headers.Authorization = 'SSWS' +process.env.API_TOKEN
    }
    // Edit request config
    return request;
}, error => {
    console.log(error);
    return Promise.reject(error);
});


app.listen(PORT, () => console.log('app started'));
  
  
const express = require('express')
const app = express()
const path = require('path')
// var app = require('express')();
var unirest = require("unirest");

const PORT = process.env.PORT || 9000

const server = app.listen(PORT, () => {
    console.log(`App running on port ${PORT}`)
    console.log('go to http://localhost:9000 ')
})

const io = require('socket.io').listen(server)

app.set('views', path.join(__dirname, 'views'))
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html')

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.status(200).render('index.html')
})

let languages = []
const req = unirest("GET", "https://google-translate1.p.rapidapi.com/language/translate/v2/languages");

req.headers({
	"accept-encoding": "application/gzip",
	"x-rapidapi-key": "e14f70d3e6mshb99f8059d4aeb3cp1eef0ajsn047b196808b7",
	"x-rapidapi-host": "google-translate1.p.rapidapi.com",
	"useQueryString": true
});

req.end(function (res) {
    if (res.error) throw new Error(res.error)
    languages = res.body.data.languages
});

io.on('connection', (client) => {
    console.log('STATUS CONNECTED OK')
    console.log(client.handshake.address + ' connected!')
    
    client.on('languages', () => {
        console.log('STATUS GET LANGUAGES')
        console.log(client.handshake.address + ' waited for input')

        io.emit('languages',languages)
    })

    client.on('translate', (message) => {
        var req = unirest("POST", "https://google-translate1.p.rapidapi.com/language/translate/v2");

        req.headers({
            "content-type": "application/x-www-form-urlencoded",
            "accept-encoding": "application/gzip",
            "x-rapidapi-key": "e14f70d3e6mshb99f8059d4aeb3cp1eef0ajsn047b196808b7",
            "x-rapidapi-host": "google-translate1.p.rapidapi.com",
            "useQueryString": true
        });

        req.form({
            "q": message.input,
            "source": message.source,
            "target": message.target
        });

        req.end(function (res) {
            if (res.error) throw new Error(res.error)

            const translated = res.body.data.translations[0].translatedText
            const jsonStr = `{"source" : "${ message.source}", "target" : "${message.target}", "input" : "${message.input}", "translated" : "${translated}"}`
            io.emit('translate', JSON.parse(jsonStr))

            console.log('STATUS TRANSLATED OK')
            console.log(client.handshake.address + ' TRANSLATE ' + source + ': ' + input + " --to-> " + target + ": " + translated);
            console.log('STATUS GET LANGUAGES')
            console.log(client.handshake.address + ' waited for input')
            
        });
    })


    client.on('disconnect', function() {
        console.log('STATUS DISCONNECTED OK')
        console.log(client.handshake.address + ' disconnected!');
    });
})

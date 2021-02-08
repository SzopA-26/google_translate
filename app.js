const express = require('express')
const app = express()
const path = require('path')
var unirest = require("unirest");

const PORT = process.env.PORT || 9000

const server = app.listen(PORT, () => {
    console.log(`App running on port ${PORT}`)
    console.log('Hello from Server !! ')
})

const io = require('socket.io').listen(server)

app.set('views', path.join(__dirname, 'views'))
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html')

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.render('index.html')
})

let languages = []
const req = unirest("GET", "https://google-translate1.p.rapidapi.com/language/translate/v2/languages");

req.headers({
	"accept-encoding": "application/gzip",
	"x-rapidapi-key": "3e9195c100msha72aca211054436p197714jsne2c2d74df22b",
	"x-rapidapi-host": "google-translate1.p.rapidapi.com",
	"useQueryString": true
});

req.end(function (res) {
    if (res.error) throw new Error(res.error)
    languages = res.body.data.languages
});

io.on('connection', (client) => {
    console.log(client.handshake.address + ' connected!')
    
    client.on('languages', () => {
        console.log(client.handshake.address + ' GET languages')

        io.emit('languages',languages)
    })

    client.on('translate', (message) => {
        const [source, input, target] = message.split(' ')

        var req = unirest("POST", "https://google-translate1.p.rapidapi.com/language/translate/v2");

        req.headers({
            "content-type": "application/x-www-form-urlencoded",
            "accept-encoding": "application/gzip",
            "x-rapidapi-key": "3e9195c100msha72aca211054436p197714jsne2c2d74df22b",
            "x-rapidapi-host": "google-translate1.p.rapidapi.com",
            "useQueryString": true
        });

        req.form({
            "q": input,
            "source": source,
            "target": target
        });

        req.end(function (res) {
            if (res.error) throw new Error(res.error)

            const translated = res.body.data.translations[0].translatedText
            const jsonStr = `{"source" : ${source}, "target" : ${target}, "input" : ${input}, "translated" : ${translated}}`
            io.emit('translate', JSON.parse(jsonStr))

            console.log(client.handshake.address + ' TRANSLATE ' + source + ': ' + input + " --to-> " + target + ": " + translated);
        });
    })

    client.on('disconnect', function() {
        console.log(client.handshake.address + ' disconnected!');
    });
})

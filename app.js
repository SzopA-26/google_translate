const express = require('express')
const app = express()
const path = require('path')
var unirest = require("unirest");

const PORT = process.env.PORT || 3000

const server = app.listen(PORT, () => {
    console.log(`App running on port ${PORT}`)
})

const io = require('socket.io').listen(server)

app.set('views', path.join(__dirname, 'views'))
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html')

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.render('index.html')
})

io.on('connection', (socket) => {
    console.log(socket.handshake.address)

    socket.on('languages', () => {
        console.log(socket.handshake.address + ' GET languages')

        const req = unirest("GET", "https://google-translate1.p.rapidapi.com/language/translate/v2/languages");

        req.headers({
            "accept-encoding": "application/gzip",
            "x-rapidapi-key": "78298e4a5dmsh216d2ec28596d9dp1a3ef9jsn740452b387c4",
            "x-rapidapi-host": "google-translate1.p.rapidapi.com",
            "useQueryString": true
        });

        req.end(function (res) {
            if (res.error) throw new Error(res.error)

            io.emit('languages',res.body.data.languages)
        });
    })

    socket.on('translate', (message) => {
        const [source, input, target] = message.split(' ')

        var req = unirest("POST", "https://google-translate1.p.rapidapi.com/language/translate/v2");

        req.headers({
            "content-type": "application/x-www-form-urlencoded",
            "accept-encoding": "application/gzip",
            "x-rapidapi-key": "78298e4a5dmsh216d2ec28596d9dp1a3ef9jsn740452b387c4",
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
            io.emit('translate', [input, source, target, translated])

            console.log(socket.handshake.address + ' TRANSLATE ' + source + ': ' + input + " --to-> " + target + ": " + translated);
        });
    })
})

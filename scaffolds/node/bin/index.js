const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const defaultRoutes = require('../routes/default.js')

const PORT = process.env.PORT || 5000

const app = express()

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use('/api/default', defaultRoutes)


app.listen(PORT, () => {
    console.log(`App listening on port: ${PORT}`)
})
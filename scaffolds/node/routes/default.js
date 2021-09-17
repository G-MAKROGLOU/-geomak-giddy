const router = require('express').Router()
const {
    get_route_code,
    post_route_code,
    put_route_code,
    delete_route_code
} = require('../repository/default')


router.get('/get', (req, res, next) => {
    //TODO: Implement your logic
    get_route_code()
    res.status(200).send({"message": "Default GET route"})
})


router.post('/post', (req, res, next) => {
    //TODO: Implement your logic
    post_route_code()
    res.status(200).send({"message": "Default POST route"})
})


router.put('/put', (req, res, next) => {
    //TODO: Implement your logic
    put_route_code()
    res.status(200).send({"message": "Default PUT route"})
})


router.delete('/put', (req, res, next) => {
    //TODO: Implement your logic
    delete_route_code()
    res.status(200).send({"message": "Default DELETE route"})
})

module.exports = router
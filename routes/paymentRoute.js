const router = require("express").Router()
const paymentController = require("../controllers/paymentController")

router.post("/create-payment",paymentController.createOrder)
router.post("/verify-payment",paymentController.verifyPayment)


module.exports = router
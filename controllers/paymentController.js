const Razorpay = require("razorpay");
const crypto = require("crypto");

const instance = new Razorpay({
  key_id: "rzp_test_6Fsll3myRMs9xe",
  key_secret: "2ZxuxUnbMuIvBPz0avekYoh6",
});

const createOrder = async (req, res) => {
  try {
    console.log(req.body);
    const options = {
      amount: Number(req.body.price * 100),
      currency: "INR",
    };
    const order = await instance.orders.create(options);
    console.log(order);
    res.status(200).send({
      message: "Done",
      data: order,
    });
  } catch (error) {
    console.log("error" + error);
  }
};

const verifyPayment = async (req,res) => {
  try {
    console.log(req.body);
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      req.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", "2ZxuxUnbMuIvBPz0avekYoh6")
      .update(body.toString())
      .digest("hex");
    const isAuth = razorpay_signature === expectedSignature;
    if (isAuth) {
        console.log("Payment successfull")
      res.redirect("http://localhost:5173/payment-successfull");
    }
  } catch (error) {
    console.log("Error" + error);
  }
};

module.exports = { createOrder, verifyPayment };

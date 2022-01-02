const pool = require("../db/db");
let middlewareObject = {};

middlewareObject.instock = async (req, res, next) => {
    const {id} = req.body
    try {
      const stockdata = await pool.query(`SELECT instock FROM books WHERE id=$1`,[id])
      if(stockdata.rows[0].instock > 0){
        next()
      }else{
        res.json({message:"Out of Stock"})
      }
    } catch (error) {
      console.log(error)
    }
  };

middlewareObject.OrderSucess = async(quantity,req,res,next)=>{
    var total = 0
    const book_id = quantity.value[0]?.book_id
    const CheckNumberoforders = await pool.query(`SELECT quantity FROM orders WHERE book_id=$1`,[book_id])
    CheckNumberoforders.rows.map(({quantity})=>{
      total += quantity
    })
    await pool.query(`SELECT instock FROM books WHERE id=$1`,[book_id],async(err,results)=>{
      let {instock} = results.rows[0]
      var UpdatedinStock = instock - total
      const UpdateQuantity = await pool.query(`UPDATE books SET instock=$1 WHERE id=$2`,[UpdatedinStock,book_id])
      return
    })
  }

middlewareObject.verify = async (req, res, next) => {
    const { captcha } = req.body
    if (!captcha) {
        return res.json({ message: "Plase send Captcha" })
    } else {
        const CaptchaKey = "6LcpxPEcAAAAADnXBTx4baMPerjlHFxNbmwb6dOH"
        const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${CaptchaKey}&response=${captcha}`
        axios.get(verifyURL)
            .then((response) => {
                if (response.data.success) {
                    next()
                } else {
                    return res.status(429).json({ message: 'Re-using captcha' })
                }
            })
    }
}
  
  module.exports = middlewareObject;
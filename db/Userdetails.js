const mongoose = require("mongoose")

const UserdeatilsSchema = mongoose.Schema({
    id:{
        type:mongoose.Schema.Types.ObjectId,
        ref: email
    },
    pincode:{
        type:Number,
        trim:true,
        required:true
    },
    street_name:{
        type:String,
        default:"Not found",
        required:true
    },
    door_number:{
        type:Number,
        required:true
    },
    state:{
        type:String,
        required:true
    },
    phone_number:{
        type:Number,
        required:true
    }
})

const Userdetails = mongoose.model("userdetail",UserdeatilsSchema)
module.exports = Userdetails
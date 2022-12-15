const express = require("express")
const app = express()
const {default:mongoose} = require("mongoose")
const route = require('./routes/route.js')

app.use(express.json())
mongoose.connect("mongodb+srv://nitukumari:Kashyapnitu8271@cluster0.5uwtnyo.mongodb.net/group10Database",{useNewUrlParser:true})
.then(()=>console.log("mongodb is connected"))
.catch(err=>console.log(err))
app.use('/',route)



app.use(function(req,res){
    res.status(404).send({status:false,message:"incorrect url"})
})

app.listen(3000,function(){
    console.log("express app is rumnning on the port 3000")
})





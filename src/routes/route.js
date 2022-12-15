const express = require("express")
const router = express.Router()
const urlController = require("../controller/urlController")


router.get("/test-me",function(req,res){
    res.send("okk fine")
})

router.post("/url/shorten",urlController.createShortUrl )
router.get("/:urlCode",urlController.redirect)

module.exports= router
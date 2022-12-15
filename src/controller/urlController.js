const urlModel = require("../models/urlModel")
const shortId = require("shortid")
const validUrl = require("valid-url")
const redis = require("redis")
const {promisify}= require("util")


//1. Connect to the redis server
const redisClient = redis.createClient(
    18904,
    "redis-18904.c301.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
  );
  redisClient.auth("nBnx8mviTe1wQmSFFwxVAhk1p5h8z6ve", function (err) {
    if (err) throw err;
  });
  
  redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
  });
  
  
  
  //2. Prepare the functions for each command
  
  const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
  const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

//---------------------------shorturlData-------------------------------//
const shortUrlData = async function (req, res) {
    try {
        let baseUrl = "http://localhost:3000"
        let url = req.body.longUrl
       
        if(Object.keys(req.body)==0 || !url || typeof(url)!="string") return res.status(400).send({status:false,
            message:"Please Provide Url"})
    
 if (!validUrl.isUri(url)) return res.status(400).send({ status: false, message: "Invalid Url" })
 
            let checkedUrl=await urlModel.findOne({longUrl:url}).select({ _id: 0, __v: 0 })
    
            if(!checkedUrl){
                let urlCode = shortId.generate(url).toLowerCase()
                let shortUrl = baseUrl + "/" + urlCode
                const saveData = await urlModel.create( {longUrl: url,shortUrl: shortUrl,urlCode: urlCode })
                let saveData1 = await urlModel.findById(saveData._id).select({ _id: 0, __v: 0 })
                return res.status(201).send({ status: true, data: saveData1 })
            }
            else return res.status(200).send({ status: true, data: checkedUrl })
            }
    catch (err) {res.status(500).send({ status: false, message: err.mesaage })
    }
}

//==================================================[Redirecting to LongUrl]===========================================================


const redirect = async function (req, res) {
    try {

      let {urlCode} = req.params
       let cachedData = await GET_ASYNC(`${urlCode}`)
       if(cachedData) {
        let getLongUrl = JSON.parse(cachedData)
        return res.redirect(302,getLongUrl.longUrl)
      } else{
    const url = await urlModel.findOne({ urlCode:urlCode });
            if (!url) return res.status(404).send({ status: false, message: "No url found" })
            await SET_ASYNC(`${urlCode}`, JSON.stringify(url))
          return res.redirect(302,url.longUrl)
      }
                  }catch (err) {return res.status(500).send({ status: false, message: err.message })}
              }
      

module.exports = {shortUrlData,redirect}


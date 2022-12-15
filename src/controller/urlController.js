
const urlModel = require("../models/urlModel");
const shortId = require("shortid");
const redis = require("redis");
const { promisify } = require("util");
const axios = require("axios");

function stringVerify(value) {
    if (typeof value !== "string" || value.trim().length == 0) {
      return false
    } return true
  }

function isValidURL(value) {
    let urlregex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/
    return urlregex.test(value)
}


//------------------------------REDIS IMPLEMENTATION----------------------//

const redisClient = redis.createClient(
    11034,
    "redis-11034.c305.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("PKuVBbdNFQhusDjCmHmVFeqP0hvLMfDi", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Redis is connected.");
});

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


//----------------------------[CREATE SHORTURL]----------------------------------

const createShortUrl = async function (req, res) {
    try {
        let { longUrl } = req.body

        if (Object.keys(req.body).length == 0) { return res.status(400).send({ status: false, message: "Please Provide detail in body." }); }
        if (!longUrl) { return res.status(400).send({ status: false, message: "longUrl is required." }); }
        if (!stringVerify(longUrl)) { return res.status(400).send({ status: false, message: "Please provide url in String only." }); }
        if (!isValidURL(longUrl)) { return res.status(400).send({ status: false, message: "Please provide in urlformat." }); }

        let options = {
            method: 'get',
            url: longUrl
        }
        let validUrl = await axios(options)
            .then(() => longUrl)
            .catch(() => null)

        if (!validUrl) { return res.status(400).send({ status: false, message: "The Link is not Valid URL." }); }

        let checkedUrl = await urlModel.findOne({ longUrl: longUrl }).select({ _id: 0, __v: 0, createdAt: 0, updatedAt: 0 })

        if (!checkedUrl) {
            let urlCode = shortId.generate(longUrl).toLowerCase()
            const baseUrl = "http://localhost:3000"
            let shortUrl = baseUrl + "/" + urlCode

            const urlData = await urlModel.create({ longUrl: longUrl, shortUrl: shortUrl, urlCode: urlCode })
            let savedData = await urlModel.findById({ _id: urlData._id }).select({ _id: 0, __v: 0, createdAt: 0, updatedAt: 0 })

            return res.status(201).send({ status: true, data: savedData });
        }
        else { return res.status(200).send({ status: true, data: checkedUrl }); }
    }
    catch (err) {
        return res.status(500).send({ status: false, mesaage: err.mesaage });
    }
}

//-----------------------------[Redirecting to LongUrl]------------------------------------------


const redirect = async function (req, res) {
    try {
        let { urlCode } = req.params

        let cachedData = await GET_ASYNC(`${urlCode}`)
        if (cachedData) {
            let getLongUrl = JSON.parse(cachedData)

            return res.status(302).redirect(getLongUrl.longUrl);
        } else {
            const geturl = await urlModel.findOne({ urlCode: urlCode })
            if (!geturl) { return res.status(404).send({ status: false, message: "Url not found." }); }

            await SET_ASYNC(`${urlCode}`, JSON.stringify(geturl))

            return res.status(302).redirect(geturl.longUrl);
        }
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}



module.exports = { createShortUrl, redirect }
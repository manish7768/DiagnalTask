const AWS = require("aws-sdk");
const axios = require("axios")
const cheerio = require("cheerio");


module.exports.scraper = (event, context, callback) => {
    const data = event.body
    console.log("Event::: ", data);
    let parseUrl = JSON.parse(data)

    const  url = parseUrl.url;  // save incoming url
    let imageUrl = []
    let flag = 0;
    (async() => {
        try {
            let ogResponse = {}
            let simpleResponse = {}
            await axios.request({
                method: 'GET',
                url: url,
                headers: {
                    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                    "accept-encoding": "gzip",
                    "accept-language": "en-US,en;q=0.9"
                },
                gzip: true
            }).then((reqAxios) => {
                let $ = cheerio.load(reqAxios.data)
    
                // check if contains <meta> tag
                let meta = $('meta') ? $('meta') : ''
                let arr = Array.from(meta)
                console.log(arr.length)
                if(arr.length > 0) {
                    // if it contains <meta> tag
                    arr.forEach((element, index) => {
                        if(element.attribs.property) {
                            if(element.attribs.property.includes("og:")){
                                ogResponse[`${element.attribs.property}`] = element.attribs.content
                            }
                        } else {
                            let data = element.attribs
                            simpleResponse[`data${index}`] = {data}
                        } 
                    })
                    if(flag != 1) {
                        let title = $("title").text()
                        let images = $("img")
                        let arrImg = Array.from(images)
                        arrImg.forEach((urlimg, index) => {
                            imageUrl.push({ "imageUrl": urlimg.attribs.src })
                        })
                        ogResponse["anotherData"] = {
                            title: title,
                            images: imageUrl
                        }
                        const customResponse = {
                            headers: {
                                "Content-Type": "application/json",
                                "Access-Control-Allow-Methods": "*",
                                "Access-Control-Allow-Origin": "*"
                            },
                            statusCode: 200,
                            body: JSON.stringify(ogResponse)
                        }
                        //console.log(customResponse)
                        callback(null, customResponse)
                    }
                } else {
                    flag = 1
                }
            }).catch(err => {
                if(!err.statusCode) {
                    err.statusCode = 500
                }
                callback(err, null)
            }) 
        } catch(err) {
            callback(err, null)
        }  
    }
    )() 
}









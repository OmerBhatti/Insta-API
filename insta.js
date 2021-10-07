const puppeteer = require("puppeteer");
const express = require("express");
var cors = require('cors')
const app = express();
app.use(cors())

async function getDataFromInsta(username){
  url = `https://www.instagram.com/${username}`;
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 1280 });
  page.setDefaultNavigationTimeout(0);
  await page.goto(url, { waitUntil: "networkidle2" });
  //username availability check
  var response;
  try {
    response = await page.$eval("h2", (el) => el.innerText);
  } catch {
    //h2 tag not found
  }

  //username exsist
  if (response == username) {
    //metedata array ['noOfPosts','followers','following']
    var metadata = await page.$$eval(".g47SY ", (meta) => {
      return meta.map((meta) => meta.innerHTML);
    });

    const noOfPosts = metadata[0];
    const followers = metadata[1];
    const following = metadata[2];

    var bio,
      website,
      profilePic,
      isPrivate = false,
      verified;

    try {
      bio = await page.$eval(".-vDIg span", (el) => el.innerText);
      website = await page.$eval(".-vDIg a", (el) => el.innerText);
      profilePic = await page.$eval("img ", (el) => el.src);
    } catch (e) {
      //error handling
      bio = "";
      website = "";
      profilePic = "";
    }

    //verified badge check
    try {
      await page.$eval(".coreSpriteVerifiedBadge");
      verified = true;
    } catch (error) {
      verified = false;
    }

    //privacy check
    try {
      await page.waitForSelector("._4Kbb_._54f4m");
      isPrivate = true;
    } catch (error) {
      isprivate = false;
    }

    //all posts extracting
    var postsarr = [];
    if (noOfPosts != 0) {
      if (!isPrivate) {
        postsarr = await page.$$eval(".KL4Bh img", (post) => {
          return post.map((post) => post.src);
        });
      }
    }

    // saving into JSON Data
    const data = {
      username: username,
      profilePic: profilePic,
      existance: true,
      totalPosts: noOfPosts,
      followers: followers,
      following: following,
      verified: verified,
      bio: bio,
      website: website,
      isPrivate: isPrivate,
      recentPosts: postsarr,
    };
    await browser.close();
    return (JSON.stringify(data, null, 3));
  } else {
    const data = {
      username: username,
      existance: false,
    };
    await browser.close();
    return (JSON.stringify(data, null, 3));
  }
}

const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send(
    JSON.stringify({ message: "server is Running!", status: true }, null, 3)
  );
});

app.get("/:un", async (req, res) => {
  username = req.params.un;
  console.log("Request for username = "+username);
  const data = await getDataFromInsta(username);
  res.send(data);
});

app.listen(port, () => {
  console.log("Server Listening on port " + port);
});

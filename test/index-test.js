const assert = require("assert");
const axios = require("axios");
const http = require("http");
const express = require("express");
const routes = require("../index.js");
const chai = require("chai");
const chaiHttp = require("chai-http");
const fs = require("fs");
const path = require("path")

const testData = path.join(__dirname, '../test_data');

chai.use(chaiHttp);

const app = express();
const httpServer = http.createServer(app);

let accessToken = process.env.ACCESS_TOKEN;
let port = "3333";
let org = "ricksteam";
let repo = "hubrouter-public";






app.use("/", (req, res, next) => {
  res.locals.accessToken = accessToken
  next();
})

app.use("/", routes);



//before and after approach from https://stackoverflow.com/questions/38223053/ensuring-server-app-runs-before-mocha-tests-start


let tiny_sha = ""; //Sometimes we need to store a sha for a later operation (such as deleting something we added).
let medium_sha = ""; //Sometimes we need to store a sha for a later operation (such as deleting something we added).
let large_sha = ""; //Sometimes we need to store a sha for a later operation (such as deleting something we added).





describe("Hubcrud functionality", function () {
  this.timeout(100000);
  describe("File Retrieval", function () {
    it("Lists the files in a directory", function (done) {

      fs.readdir(testData, (err, localFiles) => {

        if (err) {
          done(err);
        }

        axios.post(`http://localhost:${port}/crud/retrieve/${org}/${repo}`, {
          path: "test_data"
        })
          .then(result => {
            //console.log(result.data);
            let gitFiles = result.data;
            assert.equal(gitFiles.length, localFiles.length);
            for (let i = 0; i < gitFiles.length; i++) {
              let filename = gitFiles[i];
              //console.log(filename.name);
              assert(localFiles.includes(filename.name), "Local files includes remote filename");
            }
            done();
          })
          .catch(err => {
            done(err);
          })
      })
    })
    it("Gets the contents of a small file w/o a sha", function (done) {

      fs.readFile(testData + "/hello.world", "utf8", (err, localContents) => {
        //If the local machine uses Windows line endings, compensate for this
        localContents = localContents.replace("\r", "");

        if (err) {
          done(err);
        }

        axios.post(`http://localhost:${port}/crud/retrieve/${org}/${repo}`, {
          path: "test_data/hello.world"
        })
          .then(result => {
            let gitContents = result.data.content;
            console.log(result.data.sha);
            assert.equal(localContents, gitContents);
            done();
          })
          .catch(err => {
            done(err);
          })
      });
    });
    it("Get the contents of a small file with a sha", function (done) {

      fs.readFile(testData + "/hello.world", "utf8", (err, localContents) => {
        localContents = localContents.replace("\r", "");

        if (err) {
          done(err);
        }

        axios.post(`http://localhost:${port}/crud/retrieve/${org}/${repo}`, {
          sha: "980a0d5f19a64b4b30a87d4206aade58726b60e3"
        })
          .then(result => {
            let gitContents = result.data.content;
            console.log(result.data.sha);
            assert.equal(localContents, gitContents);
            done();
          })
          .catch(err => {
            done(err);
          })
      });
    });
    it("Doesn't get a non-existant file", function (done) {
      console.log("There should be an error statement below this line.")
      axios.post(`http://localhost:${port}/crud/retrieve/${org}/${repo}`, {
        path: "bad_path.txt"
      })
        .then(result => {
          done("Shouldn't have gotten here " + result.data);
        })
        .catch(err => {
          done();
        })
    });
    it("Gets the contents of a medium file with a sha", function (done) {
      fs.readFile(testData + "/Noise.png", "utf8", (err, localContents) => {

        if (err) {
          done(err);
        }

        axios.post(`http://localhost:${port}/crud/retrieve/${org}/${repo}`, {
          path: "test_data/Noise.png",
          sha: "28118e82fb7143e141024be09eb7f80e20bd097e"
        })
          .then(result => {
            let gitContents = result.data.content;
            assert.equal(localContents, gitContents);
            done();
          })
          .catch(err => {
            console.log(err.message);
            done(new Error(err.message));
          })
      });
    });
    it("Puts a tiny file ", function (done) {
      fs.readFile(testData + "/hello.world", "base64", (err, localContents) => {
        if (err) {
          done(err);
        }

        console.log(localContents.length);

        axios.post(`http://localhost:${port}/crud/create/${org}/${repo}`, {
          path: "test_data/temp_hello.world",
          message: "[skip travis] Test commit",
          content: localContents,
          encoding: "base64"
        })
          .then(result => {
            //console.log(result.data.message);
            //console.log(result.data.content.sha);
            tiny_sha = result.data.content.sha;
            //console.log(result.data.substr(0, 1000));
            done();
          })
          .catch(err => {
            console.log("Error in put");
            console.log(err.message);
            done(new Error(err.message));
          })
      })
    });
    it("Puts a medium file (slightly larger than 1mb)", function (done) {
      fs.readFile(testData + "/Noise.png", "base64", (err, localContents) => {
        if (err) {
          done(err);
        }

        console.log(localContents.length);

        axios.post(`http://localhost:${port}/crud/create/${org}/${repo}`, {
          path: "test_data/Temp_Noise.png",
          message: "[skip travis] Test commit",
          content: localContents,
          encoding: "base64"
        })
          .then(result => {
            //console.log(result.data.message);
            //console.log(result.data.content.sha);
            medium_sha = result.data.content.sha;
            //console.log(result.data.substr(0, 1000));
            done();
          })
          .catch(err => {
            console.log("Error in put");
            console.log(err.message);
            done(new Error(err.message));
          })
      })
    });
    it("Puts a large file (~10mb)", function (done) {
      fs.readFile(testData + "/Large.png", "base64", (err, localContents) => {
        if (err) {
          done(err);
        }

        console.log(localContents.length);

       
        axios({
          url:`http://localhost:${port}/crud/create/${org}/${repo}`,
          method:'post',
          maxContentLength:Infinity,
          maxBodyLength:Infinity,
          data:{
            path: "test_data/Temp_Large.png",
            message: "[skip travis] Test commit",
            content: localContents,
            encoding: "base64"
          }
        })
          .then(result => {
            console.log(result.data.message);
            console.log(result.data.content.sha);
            large_sha = result.data.content.sha;
            //console.log(result.data.substr(0, 1000));
            done();
          })
          .catch(err => {
            console.log("Error in put");
            console.log(err.message);
            done(new Error(err.message));
          })
      })
    });
    it("Deletes the tiny file", function (done) {
      fs.readFile(testData + "/Noise.png", "utf8", (err, localContents) => {
        if (err) {
          done(err);
        }

        axios.post(`http://localhost:${port}/crud/delete/${org}/${repo}`, {
          path: "test_data/temp_hello.world",
          message: "[skip travis] Test commit",
          sha: tiny_sha,
        })
        .then(result=>{
          done();
        })
        .catch(err=>{
          console.log(err.message);
          done(new Error(err.message));
        })
      })
    });
    it("Deletes the medium file", function (done) {
      fs.readFile(testData + "/Noise.png", "utf8", (err, localContents) => {
        if (err) {
          done(err);
        }

        axios.post(`http://localhost:${port}/crud/delete/${org}/${repo}`, {
          path: "test_data/Temp_Noise.png",
          message: "[skip travis] Test commit",
          sha: medium_sha,
        })
        .then(result=>{
          done();
        })
        .catch(err=>{
          console.log(err.message);
          done(new Error(err.message));
        })
      })
    });
    it("Deletes the large file", function (done) {
      fs.readFile(testData + "/Large.png", "utf8", (err, localContents) => {
        if (err) {
          done(err);
        }

        axios.post(`http://localhost:${port}/crud/delete/${org}/${repo}`, {
          path: "test_data/Temp_Large.png",
          message: "[skip travis] Test commit",
          sha: large_sha,
        })
        .then(result=>{
          done();
        })
        .catch(err=>{
          console.log(err.message);
          done(new Error(err.message));
        })
      })
    });
  })
});



before(function (done) {
  httpServer.listen(port, done);
});

after(function (done) {
  console.log("Trying to close the server.");
  httpServer.close(done);
  console.log("The server is closed");
})






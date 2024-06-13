require('dotenv').config()
const express = require("express");
const dbConnect = require("./Database/dbConnection");
const distributeRouter = require('./Controller/distributeRouter')
const clc = require("cli-color");
const {startWorker,createClientQueue} = require("./Queue/taskQueue");
const client  = require("prom-client");


const app=express();


app.use(express.json());
app.use(express.urlencoded({ extended: false }));   
app.use(express.json());

const PORT=process.env.PORT || 8086

dbConnect();

app.get("/", (req, res) => {
    return res.send({
      status: 200,
      message: "Server is up an run condition. ",
    });
  });

//Define Routes
app.use("/api", distributeRouter);


app.post('/enqueue', (req, res) => {
    const { username, task } = req.body;
    if (!username || !task) {
        return res.status(400).send('Missing username or task data');
      }
  
    // Create or get the queue for the user
    const userQueue = createClientQueue(username);
  
    // Add the task to the user's queue
    userQueue.add('myJobType',task).then(() => {
        console.log(`Task added to queue for user ${username}:`, task);
      }).catch(error => {
        console.error(`Error adding task to queue for user ${username}:`, error);
      });
    startWorker(username);
  
    res.send('Request enqueued');
  });

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({register:client.register});

app.get('/metrics',async (req,res)=>{ 
  res.setHeader('Content-Type', client.register.contentType)
  const metrics = await client.register.metrics();
  res.send(metrics);
})
  app.listen(PORT,()=>{console.log(clc.yellowBright(`Server is running on PORT:${PORT}`));});


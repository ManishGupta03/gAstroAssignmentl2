const express = require("express");
const User = require("../Models/userModel");
const Astrologer = require("../Models/astroModel");
const {startWorker,createClientQueue} = require("../Queue/taskQueue");



const distributeRouter = express.Router();

async function distributeUsers(userId) {
    const user = await User.findById(userId);
    console.log("getting user");
    if (!user) throw new Error('User not found');

    const astrologers = await Astrologer.find();
    if (astrologers.length === 0) throw new Error('No astrologers available');

    // Assuming a simple round-robin or first-available strategy for demo purposes
    const availableAstrologer = astrologers.find(astrologer => astrologer.available);

    // Assign the astrologer to the user
    user.assignedAstrologer = availableAstrologer._id;
    await user.save();

     // Update the astrologer to mark them as not available or increment their load
     availableAstrologer.available = false; // or increment a load counter
     await availableAstrologer.save();
     availableAstrologer.top=true;
 
     // Return the assigned astrologer
     return availableAstrologer;

   
}


const distributeUsersToAstrologers = async (req, res) => {
    const users = await User.find({ assignedAstrologer: null });
    const astrologers = await Astrologer.find();
  
    let totalWeight = astrologers.reduce((sum, ast) => sum + ast.weight, 0);
  
    for (const user of users) {
      let random = Math.random() * totalWeight;
      for (const astrologer of astrologers) {
        if (random < astrologer.weight) {
          user.assignedAstrologer = astrologer._id;
          astrologer.connections += 1;
          await user.save();
          await astrologer.save();
          break;
        }
        random -= astrologer.weight;
      }
    }
  
    res.send('Users distributed successfully');
  };
  

  const toggleAstrologers = async (req, res) => {
    const { astroId, top } = req.body;
    const astrologer = await Astrologer.findById(astroId);
    if (!astrologer) {
      return res.status(404).send('Astrologer not found');
    }
  
    astrologer.top = top;
    astrologer.weight = top ? astrologer.weight * 2 : astrologer.weight / 2;
    await astrologer.save();
  
    res.send(`Astrologer ${astrologer.name} is now ${top ? 'top' : 'normal'}`);
  };

distributeRouter.post("/createUser", async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).json({ userId: user._id, message: 'User created successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
  });

  distributeRouter.post("/createAstrologer", async (req, res) => {
    try {
        const astrologer = new Astrologer(req.body);  // req.body should contain { name: "Astrologer 1" }
        await astrologer.save();
        res.status(201).json({ astrologerId: astrologer._id, message: 'Astrologer created successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
  });


  distributeRouter.post("/connectUser", async (req, res) => {
    try {
        const userId = req.body.userId;
        const astrologer = await distributeUsers(userId);
        res.status(200).json(astrologer);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
  });


  distributeRouter.post("/setTopAstrologer", toggleAstrologers);

  distributeRouter.post("/distribute",distributeUsersToAstrologers);
 

  module.exports = distributeRouter;

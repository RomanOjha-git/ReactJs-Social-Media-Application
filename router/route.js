import express, { response } from "express";
import userDetail from "../models/userDetail_model.js";
import bcrypt from "bcryptjs";
import authenticate from "../middleware/authenticate.js";
import pusher from "../middleware/puhserAuth.js";
const router = express.Router();

router.get("/", (req, res) => {
  res.cookie("AuthToken", "fjdskafjdskafjdslk", {
    expires: new Date(Date.now() + 25892000000),
    httpOnly: true,
  });
  res.send("hello");
});

router.get("/u", authenticate, async (req, res) => {
  // writing logic to get all rootUser and rootUser follow user post
  // console.log(req.rootUser.friends);
  let getUserPost;
  const currentDate = new Date();
  const getUserPostFunction = async (getPastDate) => {
    // getPastDate will get those date from which we want to user post filed
    const dateCurrentDateEarly = new Date(currentDate);
    dateCurrentDateEarly.setDate(dateCurrentDateEarly.getDate() - getPastDate);
    getUserPost = await userDetail.find(
      // finding those user which i follow and get the posts of them
      // and finding post which is {getPastDate} days early
      {
        followers: {
          $elemMatch: {
            userID: req.rootUser.userID,
          },
        },
        posts: {
          $elemMatch: {
            date: { $gt: dateCurrentDateEarly },
          },
        },
      },
      {
        posts: { $slice: [0, 5] },
        userID: 1,
        name: 1,
        picture: 1,
        email: 1,
      }
    );
    return getUserPost;
  };
  getUserPost = await getUserPostFunction(5);
  if (getUserPost.length === 0) {
    // if there is not any post which is fivedays early
    getUserPost = await getUserPostFunction(30);
    if (getUserPost.length === 0) {
      // if there is not any post which is 30 days early
      getUserPost = await getUserPostFunction(90);
      if (getUserPost.length === 0) {
        // if there is not any post which is 90 days early
        getUserPost = await getUserPostFunction(180);
        if (getUserPost.length === 0) {
          // if there is not any post which is 180 days early
          getUserPost = await getUserPostFunction(365);
          if (getUserPost.length === 0) {
            // if there is not any post which is 365 days early
            getUserPost = await getUserPostFunction(1825);
          } else {
            // if there is not any post which is 5 year early
            getUserPost = await getUserPostFunction(36500);
            // then post which is 100 years early
          }
        }
      }
    }
  }
  res.status(200).json({
    userProfileDetail: req.rootUser,
    followedUserPost: getUserPost,
  });
});

router.post("/register", (req, res) => {
  console.log("register");
  const { name, email, password, cpassword, birthday, gender } = req.body;
  if (!name || !email || !password || !cpassword || !birthday || !gender) {
    return res.status(422).json({ error: "Plz fill the field properly" });
  }
  if (password !== cpassword) {
    return res.status(422).json({ error: "Password doesn't match" });
  }
  userDetail
    .findOne({ email: email })
    .then((userExist) => {
      if (userExist) {
        return res.status(422).json({ error: "Email already Exist" });
      }
      const creatingUserData = new userDetail({
        name,
        email,
        password,
        cpassword,
        birthday,
        cpassword,
        gender,
        followersNo: 0,
        followingNo: 0,
        postNo: 0,
        friendsNo: 0,
      });
      creatingUserData
        .save()
        .then(() => {
          return res
            .status(201)
            .json({ message: "User register successfully" });
        })
        .catch((err) => {
          return res.status(500).json({ error: "Failed registerd!!!" });
        });
    })
    .catch((err) => {
      console.log(err);
    });
});

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Please filled the form properly" });
    }
    const userLogin = await userDetail.findOne({ email: email });
    if (!userLogin) {
      return res.status(400).json({ error: "Error Login! User does't exist" });
    } else {
      const isPasswordMatch = await bcrypt.compare(
        password,
        userLogin.password
      );
      if (!isPasswordMatch) {
        res.status(400).json({ error: "Username and password doesn't match" });
      } else {
        let token = await userLogin.generateAuthToken();
        res.cookie("AuthToken", token, {
          expires: new Date(Date.now() + 25892000000),
          httpOnly: true,
        });
        res.status(200).json({ message: "Login Successfully" });
      }
    }
  } catch (err) {
    console.log(err);
  }
});

router.get("/u/logout", authenticate, (req, res) => {
  res.clearCookie("AuthToken", { path: "/" });
  res.status(200).send("User Logout");
});

router.post("/u/search", async (req, res) => {
  try {
    if (req.body.name.length === 0) {
      return res.status(201).json([]);
    }
    const resUser = await userDetail.find(
      {
        name: { $regex: "^" + req.body.name, $options: "i" },
      },
      { name: 1, picture: 1, userID: 1, email: 1 }
    );
    return res.status(201).json(resUser);
  } catch (err) {
    console.log(err);
  }
});

router.get("/u/profile/:userid", async (req, res) => {
  try {
    // getting userid form url parameter
    const userID = req.params.userid;
    // console.log("hello");
    console.log(userID);
    const rootUser = await userDetail.findOne({ userID: userID });
    if (!rootUser) {
      return res.status(401).json({ error: "User doesnot exist" });
    }
    return res.status(201).json(rootUser);
  } catch (err) {}
});

// this is for user follow logic if both of them follow then they will be as a friends
router.post("/u/follow", authenticate, async (req, res) => {
  try {
    const rootUser = req.rootUser;
    const { email, userID } = req.body;
    // these are the followed to user id and email
    if (!email && !userID) {
      return res.status(400).json({ error: "unauthorized user" });
    }
    const followUserExist = await userDetail.findOne({
      // here we are finding only the user which is followed by rootuser to user who is being followed
      // if it doesn't exist only after that we will going to go forther to save the data if it exist it means he had already follwed the user
      userID: rootUser.userID,
      following: {
        $elemMatch: {
          userID: userID,
        },
      },
    });
    if (followUserExist) {
      return res
        .status(200)
        .json({ message: "you had already followed this user" });
    }
    const followedToUser = await userDetail.findOne(
      {
        userID: userID,
      },
      {
        email: 1,
        name: 1,
        userID: 1,
        picture: 1,
      }
    );
    if (!followedToUser) {
      return res.status(400).json({ error: "User doesn't exist" });
    }
    const followRes = await rootUser.followUser(followedToUser);
    if (!followRes) {
      return res.status(500).json({ error: "Server error" });
    }
    // logic to store as a friend if both of them had followed
    // we had already check for rootUser that that does rootUser followed the other user
    // now we just have to check does other user follow rootUser if then then save it as a friend

    const rootUserExistInFollowUser = await userDetail.findOne({
      userID: userID,
      following: {
        $elemMatch: {
          userID: rootUser.userID,
        },
      },
    });
    if (rootUserExistInFollowUser) {
      // if root userExist in followed user only at that time we are porforming this task
      const followUserExistInRootUser = await userDetail.findOne({
        userID: rootUser.userID,
        following: {
          $elemMatch: {
            userID: userID,
          },
        },
      });
      if (followUserExistInRootUser) {
        // if both of them follow then this will run
        // storing as a friend to rootuser
        await userDetail.updateOne(
          {
            userID: rootUser.userID,
          },
          {
            // pushing the new followers into followed to user database
            $push: {
              friends: {
                name: followedToUser.name,
                email: followedToUser.email,
                userID: followedToUser.userID,
                picture: followedToUser.picture,
              },
            },
            $inc: {
              friendsNo: 1,
            },
          }
        );
        // storing as a friend to followedToUser
        await userDetail.updateOne(
          {
            userID: followedToUser.userID,
          },
          {
            // pushing the new followers into followed to user database
            $push: {
              friends: {
                name: rootUser.name,
                email: rootUser.email,
                userID: rootUser.userID,
                picture: rootUser.picture,
              },
            },
            $inc: {
              friendsNo: 1,
            },
          }
        );
      }
    }
    return res.status(200).json({ message: "Follow successfully" });
  } catch (err) {}
  res.send("hello");
});

router.post("/u/createMessage", authenticate, async (req, res) => {
  try {
    const rootUser = req.rootUser;
    const receiverUser = req.body.receiver;
    if (!req.body.receiver) {
      return res.status(401).json({ error: "receiver Doesn't exist" });
    }
    const receiverExist = await userDetail.findOne({
      // searching that user to message if it exist
      userID: receiverUser,
    });
    if (!receiverExist) {
      return res.status(400).json({ error: "User doesn't exist" });
    }
    const messageExist = await userDetail.findOne({
      userID: rootUser.userID,
      messages: {
        $elemMatch: {
          messageTo: receiverUser,
        },
      },
    });
    if (!messageExist) {
      // if initialize message doesn't exist then we have to create a field for both user
      const resSaveRootMsg = await userDetail.updateOne(
        // creating and saving message to rootUser
        {
          userID: rootUser.userID,
        },
        {
          $push: {
            messages: {
              messageTo: receiverUser,
              receiverPicture: receiverExist.picture,
            },
          },
        }
      );
      const resSaverReciverMsg = await userDetail.updateOne(
        // creating and saving message to rootUser
        {
          userID: receiverUser,
        },
        {
          $push: {
            messages: {
              messageTo: rootUser.userID,
              receiverPicture: rootUser.picture,
            },
          },
        }
      );
      if (resSaverReciverMsg && resSaveRootMsg) {
        return res.status(200).json({ message: "message created" });
      } else {
        return res.status(500).json({ error: "server error" });
      }
    } else {
      return res.status(200).json({ message: "Message already been created" });
    }
  } catch (err) {}
});

router.post("/u/getMessage", authenticate, async (req, res) => {
  try {
    const rootUser = req.rootUser;
    const receiverUserID = req.body.userID;
    if (!receiverUserID) {
      return res.status(400).json({ error: "Receiver user doesn't exist" });
    }
    const userMessage = await userDetail.findOne(
      {
        // getting rootUser message if the given condition match
        userID: rootUser.userID,
        messages: {
          $elemMatch: {
            messageTo: receiverUserID,
          },
        },
      },
      {
        messages: {
          $elemMatch: {
            messageTo: receiverUserID,
          },
        },
      }
    );
    if (!userMessage) {
      return res.status(400).json({ error: "receiver user doesn't exist" });
    }
    res.status(200).json(userMessage.messages[0]);
  } catch (err) {}
});

router.post("/u/sendMessage", authenticate, async (req, res) => {
  // we are including pusher package to make message realtime
  try {
    const rootUser = req.rootUser;
    const receiverUser = req.body.messageTo;
    if (!req.body.messageTo) {
      return res
        .status(401)
        .json({ error: "please fill reciver userID properly" });
    }
    // if message already created then we just have to save
    const resSaveReciverMsg = await userDetail.updateOne(
      // creating and saving message to rootUser
      {
        userID: receiverUser,
      },
      {
        $push: {
          "messages.$[field].message": {
            // pushing message inside the message array which match the condition of "messageBy"==='rootUser.userID'
            sender: rootUser.userID,
            content: req.body.message,
            date: Date(),
          },
        },
      },
      {
        arrayFilters: [{ "field.messageTo": rootUser.userID }],
        // here we are filtering the messageBy
      }
    );
    if (!resSaveReciverMsg.matchedCount) {
      // this will run if update doesn't happen in database it might be because of user doesn't exist
      // NOTE: i am doing this process to reduce the query for database so that the number of query became small and will be fast
      return res
        .status(400)
        .json({ error: "User doesn't exist or Message doesn't created" });
    }
    // if reciver exist and will update the message there then we can update the message for rootuser as well
    const resSaveSenderMsg = await userDetail.updateOne(
      // creating and saving message to rootUser
      {
        userID: rootUser.userID,
      },
      {
        $push: {
          "messages.$[field].message": {
            // pushing message inside the message array which match the condition of "messageBy"==='rootUser.userID'
            sender: rootUser.userID,
            content: req.body.message,
            date: Date(),
          },
        },
      },
      {
        arrayFilters: [{ "field.messageTo": receiverUser }],
        // here we are filtering the messageBy
      }
    );
    // triggering pusher here to create a message
    pusher.trigger("chat", "message", {
      // here we are trigurring only those client whose subscript with `${rootUser.userID} ${receiverUser}`
      sender: rootUser.userID,
      content: req.body.message,
      date: Date(),
    });
    return res.status(200).json({ message: "message send" });
  } catch (err) {}
});

export default router;

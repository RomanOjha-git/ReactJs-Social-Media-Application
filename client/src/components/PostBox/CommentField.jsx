import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { useSelector, useDispatch } from "react-redux";
import User_Profile_Icon from "../../assets/svg/User_profile_Icon.svg";
import {
  startProgressBar,
  stopProgressBar,
  profilePageDataAction,
  setRootUserProfileDataState,
} from "../../services/redux-actions";
import { isEmptyString } from "../../funcs/isEmptyString";
import { toastWarn, toastError, toastSuccess } from "../../services/toast";
import Api from "../../services/api/components/postBox";
import { useHistory } from "react-router-dom";

const CommentField = (props) => {
  const history = useHistory();
  const dispatch = useDispatch();
  const userProfileDetailStore = useSelector(
    (state) => state.setUserProfileDetailReducer
  );
  const [commentInputField, setCommentInputField] = useState("");
  const rootUserProfileDataState = useSelector(
    (state) => state.rootUserProfileDataState
  );

  const comment = async () => {
    try {
      dispatch(startProgressBar());
      if (isEmptyString(commentInputField)) {
        toastWarn("Please Fill the Comment Field Properly");
      } else {
        const res = await Api.comment({
          comment: commentInputField,
          postID: props.userFeedData.id,
          toId: props.userMainInformation.id,
          toUserId: props.userMainInformation.userID,
        });
        const data = await res.data;
        if (res.status === 200 && data.success) {
          props.setCommentInfo({
            ...props.commentInfo,
            postCommentInfo: {
              userID: userProfileDetailStore.userID,
              comment: commentInputField,
              picture: userProfileDetailStore.picture,
            },
            commentNo: props.commentInfo.commentNo + 1,
          });
          toastSuccess(data.msg);
          setCommentInputField("");
        } else {
          toastError(data.msg);
        }
      }
      dispatch(stopProgressBar());
    } catch (err) {
      if (err.response) {
        if (err.response.data.success === false) {
          toastError(err.response.data.msg);
        }
      } else {
        toastError("Some Problem Occur, Please Try again later!!!");
      }
      dispatch(stopProgressBar());
    }
  };

  return (
    <>
      <div className="UserPostFeed_CommentBox_RootUser_Post_Field_Container">
        <img
          className="UserPostFeed_CommentBox_Image"
          src={
            userProfileDetailStore.picture
              ? userProfileDetailStore.picture
              : User_Profile_Icon
          }
          img={userProfileDetailStore.userID}
          onClick={() => {
            const userObj = {
              ...userProfileDetailStore,
              isRootUserFollowed: false,
            };
            dispatch(profilePageDataAction(userObj));
            if (!rootUserProfileDataState.fetchedRootUserProfileData) {
              dispatch(
                setRootUserProfileDataState({
                  fetchedRootUserProfileData: false,
                  getRootUserProfileData: true,
                })
              );
            }
            history.push(`/u/profile/${userProfileDetailStore.userID}/posts`);
          }}
        />
        <input
          className="UserPostFeed_CommentBox_Input_Field"
          placeholder="Give some thought on this post..."
          type="text"
          value={commentInputField}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              comment();
            }
          }}
          onChange={(e) => {
            setCommentInputField(e.target.value);
          }}
        />
        <Icon
          className="UserPostFeed_CommentBox_Input_Emoji"
          icon="fluent:emoji-24-regular"
        />
        <Icon
          className="UserPostFeed_CommentBox_Input_Emoji"
          icon="bx:send"
          onClick={comment}
        />
      </div>
    </>
  );
};

export default CommentField;

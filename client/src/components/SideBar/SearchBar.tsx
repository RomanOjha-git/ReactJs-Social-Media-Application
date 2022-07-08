import React from "react";
import User_profile_icon from "../../assets/svg/User_profile_Icon_color_white.svg";
import { useHistory } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
// import {
//   startProgressBar,
//   stopProgressBar,
//   profilePageDataAction,
// } from "../../services/redux-actions";
import { instance as axios } from "../../services/axios";
import "../../styles/components/mainPageSearchBar.css";
import { toastError } from "../../services/toast";
import { AppState, actionCreators } from "../../services/redux";
import { bindActionCreators } from "redux";
import { Button } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { ProfilePageDataState } from "../../services/redux/pages/profile/profilePageData/types";
import { AxiosError } from "axios";

const buttonStyle = makeStyles({
  root: {},
  buttonRipple: { color: "var(--secondary-color-point-1-transparent-0)" },
});

const MainPageSearchBar = (props) => {
  const ButtonClass = buttonStyle();
  const history = useHistory();
  const dispatch = useDispatch();
  let noResultFound = true;
  // Storing Searched userData into redux
  const userProfileDetailStore = useSelector(
    (state: AppState) => state.setUserProfileDetailReducer
  );
  const { startProgressBar, stopProgressBar, profilePageDataAction } =
    bindActionCreators(actionCreators, dispatch);

  const SearchBarUser = (props) => {
    // console.log(props.userDetail);
    return (
      <>
        <Button
          TouchRippleProps={{ classes: { root: ButtonClass.buttonRipple } }}
          className={ButtonClass.root}
          id="MainPage_SearchBar_User_Container"
          onClick={async () => {
            try {
              startProgressBar();
              const res = await axios({
                method: "GET",
                url: `/u/profile/${props.userDetail.userID}`,
                headers: {
                  "Content-Type": "application/json",
                },
                withCredentials: true,
              });
              const userData = await res.data;
              if (res.status !== 200 && !userData.success) {
                // error
              } else {
                // success
                const userObj: ProfilePageDataState = {
                  ...userData.searchedUser,
                  isRootUserFollowed: userData.isRootUserFollowed,
                  throughRouting: true,
                };
                profilePageDataAction(userObj);
                stopProgressBar();
                history.push(`/u/profile/${props.userDetail.userID}/posts`);
              }
            } catch (error) {
              const err = error as AxiosError;
              if (err.response) {
                if (err.response.data.success === false) {
                  toastError(err.response.data.msg);
                }
              } else {
                toastError("Some Problem Occur, Please Try again later!!!");
              }
              stopProgressBar();
            }
          }}
        >
          {/* here link goes to there user profile  using userid link*/}
          <img
            src={
              props.userDetail.picture === undefined
                ? User_profile_icon
                : props.userDetail.picture
            }
            alt="user"
          />
          <p>{props.userDetail.userID}</p>
        </Button>
      </>
    );
  };
  const ReturnSearchBarUser = () => {
    return (
      <>
        {props.userSearchResult.map((user, index) => {
          if (user.userID && user.userID !== userProfileDetailStore.userID) {
            return <SearchBarUser userDetail={user} key={index} />;
          } else {
            return "";
          }
        })}
      </>
    );
  };
  const ReturnNoResultFound = () => {
    return (
      <>
        <div className="MainPage_SearchBar_No_Result_Container">
          <p>No Result Found</p>
        </div>
      </>
    );
  };
  const ReturnSearchResult = () => {
    if (props.userSearchResult.length === 0) {
      noResultFound = true;
    } else {
      noResultFound = false;
    }
    return (
      <> {noResultFound ? <ReturnNoResultFound /> : <ReturnSearchBarUser />}</>
    );
  };
  return (
    <>
      <div className="MainPage_SearchBar_Container">
        <h3>Search Result:</h3>
        <hr />
        <div className="MainPage_SearchBar_All_User_Container">
          <ReturnSearchResult />
        </div>
      </div>
    </>
  );
};

export default MainPageSearchBar;

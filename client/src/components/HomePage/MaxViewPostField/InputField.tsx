import React from "react";
// import { homePageUserPostFieldDataAction } from "../../../services/redux-actions";
import { useDispatch, useSelector } from "react-redux";
import { bindActionCreators } from "redux";
import { AppState, actionCreators } from "../../../services/redux";

const InputField = () => {
  const dispatch = useDispatch();
  const homePageUserPostFieldData = useSelector((state: AppState) => {
    return state.homePageUserPostFieldDataReducer;
  });
  const { homePageUserPostFieldDataAction } = bindActionCreators(
    actionCreators,
    dispatch
  );

  return (
    <>
      <textarea
        className="HomePage_MaxView_UserPost_Input_Field"
        placeholder="Post Your Thought...."
        autoFocus
        value={homePageUserPostFieldData.content}
        onChange={(e) => {
          homePageUserPostFieldDataAction({
            ...homePageUserPostFieldData,
            content: e.target.value,
          });
        }}
      ></textarea>
    </>
  );
};

export default InputField;

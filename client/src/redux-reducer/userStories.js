const initialState = {
  showStories: false,
  stories: [],
};

const userStoriesReducer = (state = initialState, action) => {
  if (action.type === "setUserStories") {
    return {
      ...state,
      stories: action.payload,
    };
  } else if (action.type === "showUserStories") {
    return {
      ...state,
      showStories: action.payload,
    };
  } else {
    return state;
  }
};

export default userStoriesReducer;

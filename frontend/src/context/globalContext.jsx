import { createContext, useReducer } from 'react';
import PropTypes from 'prop-types'

// Create a context to hold the state
export const GlobalContext = createContext();

// Define the initial state
const initialState = {
  user : {
    username: '',
    access_token: '',
    token_type: '',
    password: '',
    score: 0,
  }
};

// Define the reducer function to handle state transitions
const reducer = (state, action) => {
  console.log(action)
  switch (action.type) {
    case 'SET_USERNAME':
      return { ...state, user: action.payload};
    case 'SET_SCORE':
      return { ...state, user: {...state.user, score: action.payload}};  
    default:
      return state;
  }
}

export const GlobalProvider = ({children}) => {
  const [state, dispatch] = useReducer(reducer, initialState);

// In this return value, we passed-in children as the CONSUMER of the PROVIDER
// This will able children components to access the data inside the context
  return (
    <GlobalContext.Provider value={{ ...state, dispatch }}>
      {children}
    </GlobalContext.Provider>
  );
}

GlobalProvider.propTypes = {
    children: PropTypes.node.isRequired,
}
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'USER_LOADED':
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: action.payload,
      };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        ...action.payload,
        isAuthenticated: true,
        loading: false,
      };
    case 'AUTH_ERROR':
    case 'LOGIN_FAIL':
    case 'REGISTER_FAIL':
    case 'LOGOUT':
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
      };
    default:
      return state;
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const loadUser = async () => {
    if (localStorage.token) {
      setAuthToken(localStorage.token);
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/api/users/profile`);
      dispatch({
        type: 'USER_LOADED',
        payload: res.data,
      });
    } catch (err) {
      dispatch({ type: 'AUTH_ERROR' });
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const register = async (formData) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/register`, formData);
      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: res.data,
      });
      setAuthToken(res.data.token);
      return { success: true, message: res.data.message };
    } catch (err) {
      dispatch({ type: 'REGISTER_FAIL' });
      return {
        success: false,
        message: err.response?.data?.message || 'Pendaftaran gagal',
      };
    }
  };

  const login = async (formData) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, formData);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: res.data,
      });
      setAuthToken(res.data.token);
      return { success: true, message: res.data.message };
    } catch (err) {
      dispatch({ type: 'LOGIN_FAIL' });
      return {
        success: false,
        message: err.response?.data?.message || 'Log masuk gagal',
      };
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    setAuthToken(null);
  };

  const updateProfile = async (formData) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/users/profile`, formData);
      dispatch({
        type: 'USER_LOADED',
        payload: res.data.user,
      });
      return { success: true, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Kemaskini profile gagal',
      };
    }
  };

  const changePassword = async (formData) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/users/change-password`, formData);
      return { success: true, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Tukar kata laluan gagal',
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        register,
        login,
        logout,
        updateProfile,
        changePassword,
        loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
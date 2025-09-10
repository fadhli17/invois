import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const CustomerContext = createContext();

const initialState = {
  customers: [],
  currentCustomer: null,
  loading: false,
  error: null,
  pagination: {
    current: 1,
    pages: 1,
    total: 0
  },
  stats: {
    totalCustomers: 0,
    activeCustomers: 0,
    inactiveCustomers: 0,
    topCustomers: []
  }
};

function customerReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case 'SET_CUSTOMERS':
      return {
        ...state,
        customers: action.payload.customers,
        pagination: action.payload.pagination,
        loading: false,
        error: null
      };
    case 'SET_CURRENT_CUSTOMER':
      return {
        ...state,
        currentCustomer: action.payload,
        loading: false,
        error: null
      };
    case 'ADD_CUSTOMER':
      return {
        ...state,
        customers: [action.payload, ...state.customers],
        loading: false,
        error: null
      };
    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map(customer =>
          customer._id === action.payload._id ? action.payload : customer
        ),
        currentCustomer: state.currentCustomer?._id === action.payload._id ? action.payload : state.currentCustomer,
        loading: false,
        error: null
      };
    case 'DELETE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.filter(customer => customer._id !== action.payload),
        currentCustomer: state.currentCustomer?._id === action.payload ? null : state.currentCustomer,
        loading: false,
        error: null
      };
    case 'SET_STATS':
      return {
        ...state,
        stats: action.payload,
        loading: false,
        error: null
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
}

export const CustomerProvider = ({ children }) => {
  const [state, dispatch] = useReducer(customerReducer, initialState);

  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Set auth token from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
    }
  }, []);

  const fetchCustomers = async (params = {}) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);

      const response = await axios.get(`${API_BASE_URL}/api/customers?${queryParams}`);
      
      dispatch({
        type: 'SET_CUSTOMERS',
        payload: {
          customers: response.data.customers,
          pagination: response.data.pagination
        }
      });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.response?.data?.message || 'Gagal mengambil data pelanggan'
      });
    }
  };

  const fetchCustomer = async (id) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await axios.get(`${API_BASE_URL}/api/customers/${id}`);
      
      console.log('Customer data received:', response.data);
      
      dispatch({
        type: 'SET_CURRENT_CUSTOMER',
        payload: response.data
      });
    } catch (error) {
      console.error('Error fetching customer:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error.response?.data?.message || 'Gagal mengambil data pelanggan'
      });
    }
  };

  const createCustomer = async (customerData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await axios.post(`${API_BASE_URL}/api/customers`, customerData);
      
      dispatch({
        type: 'ADD_CUSTOMER',
        payload: response.data.customer
      });
      
      return { success: true, message: response.data.message, customer: response.data.customer };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Gagal menambah pelanggan';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, message: errorMessage };
    }
  };

  const updateCustomer = async (id, customerData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await axios.put(`${API_BASE_URL}/api/customers/${id}`, customerData);
      
      dispatch({
        type: 'UPDATE_CUSTOMER',
        payload: response.data.customer
      });
      
      return { success: true, message: response.data.message, customer: response.data.customer };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Gagal mengemaskini pelanggan';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, message: errorMessage };
    }
  };

  const deleteCustomer = async (id) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await axios.delete(`${API_BASE_URL}/api/customers/${id}`);
      
      dispatch({
        type: 'DELETE_CUSTOMER',
        payload: id
      });
      
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Gagal memadam pelanggan';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, message: errorMessage };
    }
  };

  const fetchCustomerStats = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await axios.get(`${API_BASE_URL}/api/customers/stats/overview`);
      
      dispatch({
        type: 'SET_STATS',
        payload: response.data
      });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.response?.data?.message || 'Gagal mengambil statistik pelanggan'
      });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    fetchCustomers,
    fetchCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    fetchCustomerStats,
    clearError
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};

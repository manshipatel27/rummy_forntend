import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import toast from "react-hot-toast";


const initialState = {
    status: false,
    userData: null,
    loading: false,
    error: null,
  };

  export const createAccount = createAsyncThunk("createAccount", async(data)=>{
   console.log("frontend,,", data);
   
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/register`,
          {
            name: data.name,
            email: data.email,
            password: data.password,
          },
        { withCredentials: true });
        // console.log("hhhh:::::",response);
        
        toast.success(response.data?.message);
        // console.log("hhhh111:::::",response.data.user);
        return response.data.user;
    } catch (error) {
      console.log("Error details:", error.response?.data);
      
      const validationError = error?.response?.data?.errors?.[0]?.msg;
      const mainError = error?.response?.data?.message || validationError || "Register failed";
  
      toast.error(mainError);
      throw error;
    }
  })


export const loginUser = createAsyncThunk(
    "loginUser",
    async (data) => {
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/login`,
          {
            email: data.email,
            password: data.password,
          },
          { withCredentials: true },
        );
        // console.log("login user:",response)
        // console.log("ree:", response.data.user);
        const token = response.data.token;
        const user = response.data.user;

        localStorage.setItem("token", token);
        localStorage.setItem("userData", JSON.stringify(user));
        toast.success(response.data?.message);
        return response.data;
      } catch (error) {
        console.log(error);
      
        const validationError = error?.response?.data?.errors?.[0]?.msg;
        const mainError = error?.response?.data?.message || validationError || "Register failed";
    
        toast.error(mainError);
        throw error;
      }
    }
  );

  

  export const logoutUser = createAsyncThunk(
    "logoutUser",
    async() =>{
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/logout`,{},{ withCredentials: true })
      toast.success(response.data?.message);
      return response.data.user;
    } catch (error) {
      toast.error(error?.response?.data?.error)
      throw error
    }
    }
  )
  

  const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
      setUser: (state, action) => {
        state.userData = action.payload;
        state.status = !!action.payload;
      },
    },    
    extraReducers: (builder) => {
    builder

    .addCase(createAccount.pending, (state)=>{
      state.loading= true;
      })
      .addCase(createAccount.fulfilled, (state, action) => {
      state.loading = false;
      state.userData = action.payload; 
      })
    .addCase(loginUser.pending, (state) => {
        state.loading = true;
    })
    .addCase(loginUser.fulfilled, (state, action) => {
        state.status = true;
        state.userData = action.payload.user;
        state.loading = false;
    })
    .addCase(loginUser.rejected, (state, action) => {
        // console.log("logout:", action.error);
        state.loading = false;
        state.error = action.payload || "Login failed";
    })
    .addCase(logoutUser.pending, (state) =>{
      state.loading = true;
    })
    .addCase(logoutUser.fulfilled, (state) => {
        state.status = false;
        state.userData = null;
        state.loading = false;
    })
    },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;


// export const getCurrentUser = createAsyncThunk("getCurrentUser", async () => {
  //   try {
      
  //     const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/view`, {
  //       withCredentials: true,
  //     });
  //    // console.log(response)
  //     toast.success(response.data?.message);
  //     return response.data.user;
  //   } catch (error) {
  //     toast.error(error?.response?.data?.error)
  //     throw error;
  //   }
  // });

     // .addCase(getCurrentUser.pending, (state) => {
    //   state.loading = true;
    //   state.error = null;
    // })
    // .addCase(getCurrentUser.fulfilled, (state, action) => {
    //   state.loading = false;
    //   state.userData = action.payload;
    // })
    // .addCase(getCurrentUser.rejected, (state, action) => {
    //   // state.loading = false;
    //   state.error = action.payload;
    //   state.userData = null;
    // });
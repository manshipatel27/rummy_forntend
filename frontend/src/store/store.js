import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./authSlice";
import gameSlice from "./gameSlice";



export const store = configureStore({
    reducer: {
        auth: authSlice,
        game: gameSlice
    }
})
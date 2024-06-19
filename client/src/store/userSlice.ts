import {createSlice, PayloadAction} from "@reduxjs/toolkit";

interface UserState {
    fullName: string;
    email: string;
    bookmarkedMovies: string[];
    watchedMovies: string[];
}

const initialState : UserState = {
    fullName: '',
    email: '',
    bookmarkedMovies: [],
    watchedMovies: []
};

interface RootState {
    user: UserState;
}

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUser(state, action: PayloadAction<{fullName: string, email: string}>){
            state.fullName = action.payload.fullName;
            state.email = action.payload.email;
        },
        removeUser(state){
            state.fullName = '';
            state.email = '';
            state.bookmarkedMovies = [];
            state.watchedMovies = [];
        },
        addBookmark(state, action : PayloadAction<string>){
            state.bookmarkedMovies.push(action.payload);
        },
        removeBookmark(state, action: PayloadAction<string>){
            state.bookmarkedMovies = state.bookmarkedMovies.filter(movie => movie !== action.payload);
        },
        addWatchedMovies(state, action: PayloadAction<string>){
            state.watchedMovies.push(action.payload);
        }
    }
});

export const {setUser, removeUser, addBookmark, removeBookmark, addWatchedMovies} = userSlice.actions;

export default userSlice.reducer;
import {createSlice, PayloadAction} from "@reduxjs/toolkit";

interface UserState {
    fullName: string;
    email: string;
    favorites: string[];
    watchedMovies: string[];
}

const initialState : UserState = {
    fullName: '',
    email: '',
    favorites: [],
    watchedMovies: []
};

// interface RootState {
//     user: UserState;
// }

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUser(state, action: PayloadAction<{fullName: string, email: string, favorites: string[], watchedMovies: string[]}>){
            state.fullName = action.payload.fullName;
            state.email = action.payload.email;
            state.favorites = action.payload.favorites;
            state.watchedMovies = action.payload.watchedMovies;
        },
        removeUser(state){
            state.fullName = '';
            state.email = '';
            state.favorites = [];
            state.watchedMovies = [];
        },
        addFavorites(state, action : PayloadAction<string>){
            state.favorites.push(action.payload);
        },
        removeFavorites(state, action: PayloadAction<string>){
            state.favorites = state.favorites.filter(movie => movie !== action.payload);
        },
        addWatchedMovies(state, action: PayloadAction<string>){
            state.watchedMovies.push(action.payload);
        }
    }
});

export const {setUser, removeUser, addFavorites, removeFavorites, addWatchedMovies} = userSlice.actions;

export default userSlice.reducer;
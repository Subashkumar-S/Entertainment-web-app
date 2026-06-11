import {createSlice, PayloadAction} from "@reduxjs/toolkit";

// 'loading' until the startup session check (/auth/me) resolves, so routes
// don't redirect to /login before we know whether a session exists.
type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface UserState {
    fullName: string;
    email: string;
    favorites: string[];
    watchedMovies: string[];
    status: AuthStatus;
}

const initialState : UserState = {
    fullName: '',
    email: '',
    favorites: [],
    watchedMovies: [],
    status: 'loading'
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
            state.status = 'authenticated';
        },
        removeUser(state){
            state.fullName = '';
            state.email = '';
            state.favorites = [];
            state.watchedMovies = [];
            state.status = 'unauthenticated';
        },
        // Resolve the startup check when no session exists (without clearing data).
        setUnauthenticated(state){
            state.status = 'unauthenticated';
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

export const {setUser, removeUser, setUnauthenticated, addFavorites, removeFavorites, addWatchedMovies} = userSlice.actions;

export default userSlice.reducer;
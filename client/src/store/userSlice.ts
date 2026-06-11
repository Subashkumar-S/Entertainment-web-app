import {createSlice, PayloadAction} from "@reduxjs/toolkit";

// 'loading' until the startup session check (/auth/me) resolves, so routes
// don't redirect to /login before we know whether a session exists.
type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface Rating {
    id: string;
    value: number;
}

interface UserState {
    fullName: string;
    email: string;
    favorites: string[];
    watchlist: string[];
    watchedMovies: string[];
    ratings: Rating[];
    status: AuthStatus;
}

const initialState : UserState = {
    fullName: '',
    email: '',
    favorites: [],
    watchlist: [],
    watchedMovies: [],
    ratings: [],
    status: 'loading'
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        // Arrays are optional so older callers / partial payloads stay safe.
        setUser(state, action: PayloadAction<{
            fullName: string;
            email: string;
            favorites?: string[];
            watchlist?: string[];
            watchedMovies?: string[];
            ratings?: Rating[];
        }>){
            state.fullName = action.payload.fullName;
            state.email = action.payload.email;
            state.favorites = action.payload.favorites ?? [];
            state.watchlist = action.payload.watchlist ?? [];
            state.watchedMovies = action.payload.watchedMovies ?? [];
            state.ratings = action.payload.ratings ?? [];
            state.status = 'authenticated';
        },
        removeUser(state){
            state.fullName = '';
            state.email = '';
            state.favorites = [];
            state.watchlist = [];
            state.watchedMovies = [];
            state.ratings = [];
            state.status = 'unauthenticated';
        },
        // Resolve the startup check when no session exists (without clearing data).
        setUnauthenticated(state){
            state.status = 'unauthenticated';
        },
        addFavorites(state, action : PayloadAction<string>){
            if (!state.favorites.includes(action.payload)) state.favorites.push(action.payload);
        },
        removeFavorites(state, action: PayloadAction<string>){
            state.favorites = state.favorites.filter(movie => movie !== action.payload);
        },
        addToWatchlist(state, action: PayloadAction<string>){
            if (!state.watchlist.includes(action.payload)) state.watchlist.push(action.payload);
        },
        removeFromWatchlist(state, action: PayloadAction<string>){
            state.watchlist = state.watchlist.filter(id => id !== action.payload);
        },
        toggleWatched(state, action: PayloadAction<string>){
            if (state.watchedMovies.includes(action.payload)) {
                state.watchedMovies = state.watchedMovies.filter(id => id !== action.payload);
            } else {
                state.watchedMovies.push(action.payload);
            }
        },
        setRating(state, action: PayloadAction<Rating>){
            const existing = state.ratings.find(r => r.id === action.payload.id);
            if (existing) existing.value = action.payload.value;
            else state.ratings.push(action.payload);
        },
        removeRating(state, action: PayloadAction<string>){
            state.ratings = state.ratings.filter(r => r.id !== action.payload);
        }
    }
});

export const {
    setUser,
    removeUser,
    setUnauthenticated,
    addFavorites,
    removeFavorites,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatched,
    setRating,
    removeRating,
} = userSlice.actions;

export default userSlice.reducer;

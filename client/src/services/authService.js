import {
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase/auth";
const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
    try{
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log(user);
        return user;
    }
    catch(error){
        console.log(error);
        return null;

    }
};

export const signOut = async () => {
    try{
        await auth.signOut();   
    }
    catch(error){
        console.log(error);
    }
};

export const getCurrentUser = () => {
    return auth.currentUser;
};

export const onAuthStateChanged = (callback) => {
    return auth.onAuthStateChanged(callback);
};

export const isAuthenticated = () => {
    return !!auth.currentUser;
};

export const getUserToken = async () => {
    const user = auth.currentUser;
    if(user){
        return await user.getIdToken();
        console.log(token);
    } else {
        return null;
    }
};






import { Navigate } from "react-router-dom";
import { auth } from "../firebase"

export default function ProtectedRoute({children}:{children:React.ReactNode}){

    const user = auth.currentUser; // firebase에 유저정보 요청(user or null)
    if(user === null) {
        return <Navigate to="/login"/>
    }

    return children
}
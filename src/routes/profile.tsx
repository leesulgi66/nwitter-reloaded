import styled from "styled-components";
import { auth, db } from "../firebase"
import { useEffect, useState } from "react";
import { updateProfile } from "firebase/auth";
import S3ImageUpload from "../components/s3ImageUpload";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { ITweet } from "../components/timeline";
import Tweet from "../components/tweet";

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 15px;
`;

const AvatarUpload = styled.label`
    width: 80px;
    overflow: hidden;
    height: 80px;
    border-radius: 50%;
    background-color: #1d9cf038;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    svg{
        width: 50px;
    }
`;

const AvatarImg = styled.img`
    width: 100%;
`;

const AvatarInput = styled.input`
    display: none;
`;

const Tweets = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 65%;
`;

const Name = styled.div`
    display:flex;
    flex-direction: column;
    align-items: center;
    font-size: 22px;
`;

const EditButton = styled.div`
    display: flex;
    display: inline-block;
    align-items: center;
    flex-direction: row-reverse;
    text-align: center;
    cursor: pointer;
    width: 60px;
    svg{
        width: 30px;
    }
`;
const TextArea = styled.textarea`
    border: 1px solid white;
    padding: 2px;
    border-radius: 10px;
    font-size: 22px;
    color: white;
    background-color: black;
    width: 40%;
    resize: none;
    &:focus {
        outline: none;
        border-color: #1d9bf0;
    }
`;

const TextOne = styled.div`
    padding-top: 30px;
    text-align: left;
`;

export default function Profile() {
const user = auth.currentUser;
const [avatar, setAvatar] = useState(user?.photoURL);
const [inputText, setInputText] = useState(user?.displayName);
const [isEditing, setEditing] = useState(false);
const [tweets, setTweets] = useState<ITweet[]>([]);
const onAvatarCahange = async (e:React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if(!user) return;
    if(!files || files.length === 0) return;
    if(files[0].size > 1 * 1024 * 1024) {
        alert("Image file size should be less than 1Mb");
        return;
    };
    const s3url = S3ImageUpload(files[0], user.displayName);
    setAvatar((await s3url).image); 
}
useEffect(()=>{
    const updatePfo = async()=> {
        if(!user) return;
        await updateProfile(user, {
            photoURL: avatar,
        });
    }
    updatePfo();
}, [avatar]);

useEffect(()=>{
    const fetchTweets = async() => {
        const tweetQuery = query(
            collection(db, "tweets"),
            where("userId", "==", user?.uid),
            orderBy("createdAt", "desc"),
            limit(25)
        );
        const snapshot = await getDocs(tweetQuery);
        const tweets = snapshot.docs.map((doc) => {
            const { tweet, createdAt, userId, username, photo, photoKey } = doc.data();
            return {
                tweet, createdAt, userId, username, photo, photoKey,id: doc.id
            };
        });
        setTweets(tweets);
    };
    fetchTweets();
}, []);

const onEdit = () => {
    setEditing(!isEditing);
    setInputText(user?.displayName);
}

const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
}

const editDone = async ()=> {
    const ok = confirm("Are you sure you want to edit this profile?");
    if(!ok || !user) return;
    const special_pattern = /[`~!@#$%^&*|\\\'\";:\/?]/gi;
    if(inputText!.search(/\s/g) > -1) {
        alert("There is a blank space in your name.");
    }else if(special_pattern.test(inputText!) == true){
        alert("You can't use special characters.");
    }else{
        console.log("you can use");
        updateProfile(user, {displayName : inputText});
        window.location.reload();
    }
}
    return (
        <Wrapper>
            <AvatarUpload htmlFor="avatar">
                {avatar ? <AvatarImg src={avatar}/> : <svg fill="none" strokeWidth={1.5} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>}
            </AvatarUpload>
            <AvatarInput onChange={onAvatarCahange} id="avatar" type="file" accept="image/*"/>
            <Name>
                {isEditing ? <TextArea onChange={onChange} rows={1} maxLength={20} value={inputText as string} required /> : user?.displayName || "Anonymous"}
                <EditButton>
                    {isEditing ? <svg onClick={onEdit} fill="none" strokeWidth={1.5} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg> : <svg onClick={onEdit} data-slot="icon" fill="none" stroke-width="1.5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"></path>
                    </svg>}
                    {isEditing ? <svg onClick={editDone} data-slot="icon" fill="none" stroke-width="1.5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"></path>
                    </svg> : null}
                </EditButton>
            </Name>
            <TextOne>
                My Tweets
            </TextOne>
            <Tweets>
                {tweets.map(tweet => <Tweet key={tweet.id} {...tweet} />)}
            </Tweets>
        </Wrapper>
    )
}
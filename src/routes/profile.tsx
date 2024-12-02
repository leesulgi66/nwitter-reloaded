import styled from "styled-components";
import { auth, db } from "../firebase"
import React, { useEffect, useState } from "react";
import AWS from 'aws-sdk';
import { updateProfile } from "firebase/auth";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { ITweet } from "../components/timeline";
import Tweet from "../components/tweet";

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 20px;
`;
const AvatarUpload = styled.label`
    width: 80px;
    overflow: hidden;
    height: 80px;
    border-radius: 50%;
    background-color: #252525;
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
const Name = styled.span`
    font-size: 22px;
    line-height: 50px;
    display:flex;
    align-items: center;
    justify-content: center;
`;
const Tweets = styled.div`
    display: flex;
    width:100%;
    flex-direction: column;
    gap: 10px;
`;
const EditButton = styled.div`
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 30px;
    width: 30px;
    margin-left: 10px;
    svg{
        width:30px;
    }
`;
const TextArea = styled.textarea`
    border: 2px solid white;
    padding: 10px;
    border-radius: 20px;
    font-size: 22px;
    color: white;
    background-color: black;
    width: 40%;
    resize: none;
    &::placeholder {
        font-size: 22px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    }
    &:focus {
        outline: none;
        border-color: #1d9bf0;
    }
`;
export default function Profile() {
    // s3 settings
    const ACCESS_KEY = import.meta.env.VITE_ACCESS_KEY
    const SECRET_KEY = import.meta.env.VITE_SECRET_KEY
    const RESION = "ap-northeast-2";
    const S3_BUKKET = "sulgibucket";
    AWS.config.update({
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY,
    });
    const myBuket = new AWS.S3({
        params: { Buket: S3_BUKKET },
        region: RESION,
    });
    //--------------
    const user = auth.currentUser;
    const [isEditing, setEditing] = useState(false);
    const [inputText, setInputText] = useState(user?.displayName);
    const [avatar, setAvatar] = useState(user?.photoURL);
    const [tweets, setTweets] = useState<ITweet[]>([]);
    const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        console.log(e.target.value);
        setInputText(e.target.value);
    }
    const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const { files } = e.target;
        if (!user) return;
        if (files && files.length === 1) {
            const file = files[0];

            const params = {
                ACL: "public-read",
                Body: file,
                Bucket: S3_BUKKET,
                ContentType: file.type,
                Key: `avatar/${user?.uid}`,
            };

            await myBuket.upload(params, (error: any) => {
                console.log(error);
            }).promise().then((data) => {
                const url = data.Location;
                const photoKey = data.Key;
                updateProfile(user, { photoURL: url });
                setAvatar(url);
                window.location.reload();
            });
        }
    };
    const fetchTweets = async () => {
        const tweetQuery = query(
            collection(db, "tweets"),
            where("userId", "==", user?.uid),
            orderBy("createAt", "desc"),
            limit(25)
        );
        const snapshot = await getDocs(tweetQuery);
        const tweets = snapshot.docs.map((doc) => {
            const { tweet, createdAt, userId, username, photo } = doc.data();
            return {
                tweet, createdAt, userId, username, photo, id: doc.id
            };
        });
        setTweets(tweets);
    };
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

    useEffect(() => {
        fetchTweets();
    }, []);
    const onEdit = () => {
        setEditing(true);
    }
    return (<Wrapper>
        <AvatarUpload htmlFor="avatar">
            {avatar ? <AvatarImg src={avatar} /> : <svg data-slot="icon" fill="none" stroke-width="1.5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"></path>
            </svg>}
        </AvatarUpload>
        <AvatarInput onChange={onAvatarChange} id="avatar" type="file" accept="image/*" />
        <Name>
            {/* {user?.displayName ?? "Anonymous"}  */}
            {isEditing ? <TextArea onChange={onChange} rows={1} maxLength={20} value={inputText as string} required /> : user?.displayName || "Anonymous"}
            <EditButton>
                {isEditing ? null : <svg onClick={onEdit} data-slot="icon" fill="none" stroke-width="1.5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"></path>
                </svg>}
                {isEditing ? <svg onClick={editDone} data-slot="icon" fill="none" stroke-width="1.5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"></path>
                </svg> : null}
            </EditButton>
        </Name>
        <Tweets>
            {tweets.map(tweet => <Tweet key={tweet.id} {...tweet} />)}
        </Tweets>
    </Wrapper>
    );
}
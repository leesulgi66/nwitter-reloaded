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
`;
const Tweets = styled.div`
    display: flex;
    width:100%;
    flex-direction: column;
    gap: 10px;
`;
export default function Profile() {
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

    const user = auth.currentUser;
    const [avatar, setAvatar] = useState(user?.photoURL);
    const [tweets, setTweets] = useState<ITweet[]>([]);
    const onAvatarChange = async (e:React.ChangeEvent<HTMLInputElement>) => {
        const {files} = e.target;
        if(!user) return;
        if(files && files.length === 1) {
            const file = files[0];

            const params = {
                ACL : "public-read",
                Body : file,
                Bucket : S3_BUKKET,
                ContentType: file.type,
                Key : `avatar/${user?.uid}`,
            };
            
            await myBuket.upload(params, (error:any)=>{
                console.log(error);
            }).promise().then((data)=>{
                const url = data.Location;
                updateProfile(user, {photoURL: url});
                console.log(url);
                setAvatar(url);
                window.location.reload();
            });
        }
    };
    const fetchTweets = async()=>{
        const tweetQuery = query(
            collection(db, "tweets"),
            where("userId", "==", user?.uid),
            orderBy("createAt", "desc"),
            limit(25)
        );
        const snapshot = await getDocs(tweetQuery);
        const tweets = snapshot.docs.map((doc)=>{
            const {tweet, createdAt, userId, username, photo} = doc.data();
            return {
                tweet, createdAt, userId, username, photo, id:doc.id
            };
        });
        console.log(tweets);
        setTweets(tweets);
    };
    useEffect(()=>{
        fetchTweets();
    }, []);
    return (<Wrapper>
        <AvatarUpload htmlFor="avatar">
            {avatar ? <AvatarImg src={avatar} /> : <svg data-slot="icon" fill="none" stroke-width="1.5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"></path>
            </svg>}
        </AvatarUpload>
        <AvatarInput onChange={onAvatarChange} id="avatar" type="file" accept="image/*" />
        <Name>
            {user?.displayName ?? "Anonymous"}
        </Name>
        <Tweets>
            {tweets.map(tweet => <Tweet key={tweet.id} {...tweet} />)}
        </Tweets>
    </Wrapper>
    );
}
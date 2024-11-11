import { collection, doc, getDocs, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { db } from "../firebase";
import Tweet from "./tweet";
import { Unsubscribe } from "firebase/auth";

export interface ITweet {
    id: string;
    photo?: string;
    tweet: string;
    userId: string;
    username: string;
    createdAt: number;   
}

const Wrapper = styled.div`
    display: flex;
    gap: 10px;
    flex-direction: column;
`;

export default function Timeline() {
    const [tweets, setTweet] = useState<ITweet[]>([]);
    const fetchTweets = async()=> {
        const tweetsQuery = query(
            collection(db, "tweets"),
            orderBy("createAt", "desc"),
            limit(25),
        );
        const snapshot = await getDocs(tweetsQuery);
        const tweets = snapshot.docs.map((doc)=>{
            const {tweet, createdAt, userId, username, photo} = doc.data();
            return {
                tweet, createdAt, userId, username, photo, id:doc.id
            };
        });
        setTweet(tweets);
    }
    useEffect(()=>{
        // onSnapshot을 이용한 실시간 연결(다만 쿼리의 양이 많아 무료사용시 제한이 걸린다.)
        // let unsubscribe : Unsubscribe | null = null;
        //     unsubscribe = await onSnapshot(tweetsQuery, (snapshot)=>{
        //         const tweets = snapshot.docs.map((doc)=>{
        //             const {tweet, createdAt, userId, username, photo} = doc.data();
        //             return {
        //                 tweet, createdAt, userId, username, photo, id:doc.id
        //             };
        //         });
        //         setTweet(tweets);
        //     });
        // };
        // fetchTweets();
        // return ()=>{
        //     unsubscribe && unsubscribe();
        // }
        fetchTweets();
        console.log("effect");
    }, []);
    return <Wrapper>{tweets.map(tweet => <Tweet key={tweet.id} {...tweet} />)}</Wrapper>
}
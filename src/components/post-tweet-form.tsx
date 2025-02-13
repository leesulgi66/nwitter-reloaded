import { addDoc, collection, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import styled from "styled-components"
import { auth, db } from "../firebase";
import AWS from "aws-sdk";

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const TextArea = styled.textarea`
    border: 2px solid white;
    padding: 20px;
    border-radius: 20px;
    font-size: 16px;
    color: white;
    background-color: black;
    width: 100%;
    resize: none;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    &::placeholder {
        font-size: 16px;
    }
    &:focus {
        outline: none;
        border-color: #1d9bf0;
    }
`;

const AttachFileButton = styled.label`
    padding: 10px 0px;
    color: #1d9bf0;
    text-align: center;
    border-radius: 20px;
    border: 1px solid #1d9bf0;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
`;

const AttachFileInput = styled.input`
    display: none;
`;

const SubmitBtn = styled.input`
    background-color: #1d9bf0;
    color: white;
    border: none;
    padding: 10px 0px;
    border-radius: 20px;
    font-size: 16px;
    cursor: pointer;
    &:hover,
    &:active {
        opacity: 0.8;
    }
`;

export default function PostTweetFrorm() {
    //S3 setting--------------------------------------
    const ACCESS_KEY = import.meta.env.VITE_ACCESS_KEY
    const SECRET_KEY = import.meta.env.VITE_SECRET_KEY
    const REGION = "ap-northeast-2";
    const S3_BUKKET = "sulgibucket";
    AWS.config.update({
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY,
    });
    const myBuket = new AWS.S3({
        params: { Buket: S3_BUKKET },
        region: REGION,
    });
    //------------------------------------------------
    const [isLoading, setLoading] = useState(false);
    const [tweet, setTweet] = useState("");
    const [file, setFile] = useState<File|null>(null);
    const onChange = (e:React.ChangeEvent<HTMLTextAreaElement>) => {
        setTweet(e.target.value);
    }
    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>)=> {
        const{files} = e.target;
        if(files && files.length === 1) {
            if(files[0].size < 1*1024*1024){
                setFile(files[0]);
                console.log("file on");
            }else {
                alert("image file size should be less than 1Mb");
            }
        }
    }
    const onSubmit = async(e:React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const user = auth.currentUser
        if(!user || isLoading || tweet === "" || tweet.length > 180) return;
        try{
            setLoading(true);
            const doc = await addDoc(collection(db, "tweets"), {
                tweet,
                createdAt: Date.now(),
                username: user.displayName || "Anonymous",
                userId: user.uid,
                photo : "", 
                photoKey: "",
            });

            if(file) {
                //S3 upload
                const params = {
                    ACL : "public-read",
                    Body : file,
                    Bucket : S3_BUKKET,
                    ContentType: file.type,
                    Key : "upload/" + file.name,
                };
                const url = await myBuket.upload(params, (error:any)=>{
                    console.log(error);
                }).promise()
                await updateDoc(doc, {
                    photo: url.Location,
                    photoKey : url.Key
                })
            }
        }catch(e) {
            console.log(e);
        }finally {
            setLoading(false);
            setTweet("");
            setFile(null);
        }
    }
    return (
    <Form onSubmit={onSubmit}>
        <TextArea required rows={5} maxLength={180} onChange={onChange} value={tweet} placeholder="What is happening?"/>
        <AttachFileButton htmlFor="file">{file ? "Photo added ✅" : "Add photo"}</AttachFileButton>
        <AttachFileInput onChange={onFileChange} type="file" id="file" accept="image/*" />
        <SubmitBtn type="submit" value={isLoading ? "Posting..." : "Post Tweet"}/>
    </Form>
    )
}
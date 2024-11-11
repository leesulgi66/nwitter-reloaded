import { addDoc, collection, updateDoc } from "firebase/firestore";
import { useState } from "react";
import styled from "styled-components"
import { auth, db, storage } from "../firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

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
    &::placeholder {
        font-size: 16px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
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
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    cursor: pointer;
    &:hover,
    &:active {
        opacity: 0.85;
    }
`;

export default function PostTweetForm() {
    const [isLoading, setLoading] = useState(false);
    const [tweet, setTweet] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTweet(e.target.value);
    }
    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>)=> {
        const{files} = e.target;
        if(files && files.length === 1) {
            if(files[0].size < 1*1024*1024){
                setFile(files[0]);
            }else {
                alert("image file size should be less than 1Mb");
            }
        }
    }
    const onSubmit = async(e:React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const user = auth.currentUser
        if(!user || isLoading || tweet ==="" || tweet.length > 180) return;
        try {
            setLoading(true);
            const doc = await addDoc(collection(db, "tweets"), {
                tweet,
                createAt:Date.now(),
                username: user.displayName || "Anonymous",
                userId: user.uid,
            });
            if(file) { // file을 업로드 후 url주소 받기
                const locationRef = ref(storage, `tweets/${user.uid}/${doc.id}`); //img file의 경로를 설정
                const result = await uploadBytes(locationRef, file); //promise를 반환하고, 그 결과값에 업로드 결과에 대한 참조가 있다.
                const url = await getDownloadURL(result.ref); //result 값을 참조해 url주소를 반환받는다.
                console.log(url);
                await updateDoc(doc, {photo: url}); // 위에서 추가한 doc에 photo항목을 추가해 준다.
            }
            setTweet("");
            setFile(null);

        }catch(e) {
            console.log(e);
        }finally {
            setLoading(false);
        }
    }
    return <Form onSubmit={onSubmit}>
        <TextArea rows={5} maxLength={180} onChange={onChange} value={tweet} placeholder="What is happening?!" required/>
        <AttachFileButton htmlFor="file">{file ? "Potho added✔" : "Add photo"}</AttachFileButton>
        <AttachFileInput onChange={onFileChange} type="file" id="file" accept="image/*"/>
        <SubmitBtn type="submit" value={isLoading ? "Posting..." : "Post Tweet"}/>
    </Form>
}
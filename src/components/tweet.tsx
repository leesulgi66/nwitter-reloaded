import styled from "styled-components";
import { ITweet } from "./timeline";
import { auth, db, storage } from "../firebase";
import { collection, deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { useState } from "react";

const Wrapper = styled.div`
    display: grid;
    grid-template-columns: 3fr 1fr;
    padding: 20px;
    border: 1px solid rgba(255,255,255,0.5);
    border-radius: 15px;
`;

const Column = styled.div``;

const Photo = styled.img`
    width: 100px;
    height: 100px;
    border-radius: 15px;
`;

const Username = styled.span`
    font-weight: 600;
    font-size: 15px;

`;

const Payload = styled.p`
    margin: 10px 0px;
    font-size: 18px;
`;

const DeleteButton = styled.button`
    background-color: tomato;
    color: white;
    font-weight:600;
    border: 0;
    font-size: 12px;
    padding: 5px 10px;
    text-transform: uppercase;
    border-radius: 5px;
    cursor: pointer;
`;

const EditButton = styled.button`
    background-color: #a1a1a14f;
    color: white;
    font-weight: 600;
    border: 0;
    font-size: 12px;
    margin-left: 5px;
    padding: 5px 10px;
    text-transform: uppercase;
    border-radius: 5px;
    cursor: pointer;
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

export default function Tweet({username, photo, tweet, userId, id}:ITweet) {
    const [isEditing, setEditing] = useState(false);
    const [isTweet, setIsTweet] = useState(tweet);
    const user = auth.currentUser;
    const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setIsTweet(e.target.value);
    }
    const onDelete = async() => {
        const ok = confirm("Are you sure you want to delete this tweet?");
        if(!ok || user?.uid !== userId) return;
        try{
            await deleteDoc(doc(db, "tweets", id)); // 트윗 삭제
            if(photo) { // 사진이 있을 경우(
                const photoRef = ref(storage, `tweets/${user.uid}/${id}`);
                await deleteObject(photoRef);
            }
        }catch(e){
            console.log(e);
        }finally {

        }
    }
    const onEdit = () => {
        if(user?.uid !== userId) return;
        setEditing(true);
    }

    const onEditDone = async() => {
        const ok = confirm("Are you sure you want to edit this tweet?");
        if(!ok || user?.uid !== userId) return;
        tweet = isTweet;
        console.log(isTweet);
        console.log(tweet);
        try {
            await setDoc(doc(db, `tweets/${id}`), {
                tweet,
                createAt:Date.now(),
                username: user.displayName || "Anonymous",
                userId: user.uid,
            });
            // if(file) { // file을 업로드 후 url주소 받기
            //     const locationRef = ref(storage, `tweets/${user.uid}/${doc.id}`); //img file의 경로를 설정
            //     const result = await uploadBytes(locationRef, file); //promise를 반환하고, 그 결과값에 업로드 결과에 대한 참조가 있다.
            //     const url = await getDownloadURL(result.ref); //result 값을 참조해 url주소를 반환받는다.
            //     console.log(url);
            //     await updateDoc(doc, {photo: url}); // 위에서 추가한 doc에 photo항목을 추가해 준다.
            // }
            //setFile(null);
        }catch(e) {
            console.log(e);
        }finally {
            setEditing(false);
        }
    }
    return <Wrapper>
        <Column>
            <Username>{username}</Username>
            <Payload>{isEditing ? <TextArea onChange={onChange} rows={1} maxLength={180} value={isTweet} required/>:tweet}</Payload>
            {user?.uid === userId ? <DeleteButton onClick={onDelete}>Delete</DeleteButton> : null}
            {user?.uid === userId ? <EditButton onClick={onEdit}>Edit</EditButton> : null}
            {user?.uid === userId && isEditing ? <EditButton onClick={onEditDone}>Done</EditButton> : null}
        </Column> 
        <Column>{photo ? <Photo src={photo} /> : null}</Column>
    </Wrapper>
}
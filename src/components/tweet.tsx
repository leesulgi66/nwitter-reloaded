import styled from "styled-components";
import { ITweet } from "./timeline";
import { auth, db } from "../firebase";
import { addDoc, collection, deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import AWS from "aws-sdk";
import { useEffect, useRef, useState } from "react";

const Wrapper = styled.div`
    display: grid;
    grid-template-columns: 3fr 1fr;
    padding: 20px;
    border: 1px solid rgba(255,255,255,0.5);
    border-radius: 15px;

`;

const Column = styled.div`
    &.photoBox {
        margin-left: 10%;
    }
`;

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
    background-color: dodgerblue;
    color: white;
    margin-right: 0.5%;
    font-weight: 600;
    font-size: 12px;
    padding: 5px 10px;
    text-transform: uppercase;
    border-radius: 5px;
    cursor: pointer;
    &.cancelBtn {
        background-color: inherit;
        color: dodgerblue;
        border-color: white;
    }
    &.editSubmitBtn {
        background-color: white;
        color: dodgerblue;
        float: right;
    }
`;

const FileChangeButton = styled.label`
    display: inline-block;
    margin: 3% 20%;
    text-align: center;
    width: 35%;
    padding: 2px 7px;
    border-radius: 5px;
    border: 1px solid white;
    text-transform: uppercase;
    font-size: 11px;
    cursor: pointer;
`;

const FileChangeInput = styled.input`
    display: none;
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

export default function Tweet({username, photo, tweet, userId, id, photoKey}:ITweet) {
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
    const [isEdit, setEdit] = useState(false);
    const [changeTweet, setChangeTweet] = useState(tweet);
    const [viewPhoto, setViewPhoto] = useState(photo);
    const [file, setFile] = useState<File|null>(null);
    const user = auth.currentUser;
    const onDelete = async() => {
        const ok = confirm("Are you sure you want to delete this tweet?");
        if(!ok || user?.uid !== userId) return;
        try {
            await deleteDoc(doc(db, "tweets", id));
            if(photo !== "") {
                if(!photoKey) return;
                const params = {
                    Bucket: S3_BUKKET,
                    Key: photoKey,
                };
                myBuket.deleteObject(params, (error:any)=>{console.log(error)});
            }
        } catch (e) {
            console.log(e);
        } finally {

        }
    }
    const onChange = (e:React.ChangeEvent<HTMLTextAreaElement>) => {
        setChangeTweet(e.target.value);
    }
    const onEditSubmit =async() => {
        const ok = confirm("Are you sure you want to edit this tweet?");
        if(!ok || user?.uid !== userId) return;
        try{
            setLoading(true);
            const docRef = doc(db, "tweets", id);
                await updateDoc(docRef, {
                    username: user.displayName,
                    createAt:Date.now(),
                    tweet: changeTweet,
                    userId: user.uid,
                    }
                );
                // await setDoc(doc(db, `tweets/${id}`), {
                //     tweet: changeTweet,
                //     createdAt: Date.now(),
                //     username: user.displayName || "Anonymous",
                //     userId: user.uid,
                // })
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
                }).promise();
                await updateDoc(docRef, {
                    photo: url.Location,
                    photoKey: url.Key,
                });
            }
        }catch(e) {
            console.log(e);
        }finally {
            setLoading(false);
            setFile(null);
            setEdit(false);
        }
    }
    const onEdit = () => {
        if(user?.uid !== userId) return;
        setEdit(!isEdit);
        setChangeTweet(tweet);
        setFile(null);
    }
    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { files } = e.target;
        if (!files || files.length === 0) return;
    
        if (files[0].size > 1 * 1024 * 1024) {
            alert("Image file size should be less than 1Mb");
            return;
        }
    
        setFile(files[0]);
    };
    useEffect(() => {
        if (!file) return;
        console.log("file useeffect")
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const filelocation = reader.result as string;
            setViewPhoto(filelocation);
        };
    }, [file]);

    return (<Wrapper>
        <Column>
            <Username>{username}</Username>
            {isEdit ? <TextArea required rows={2} maxLength={180} value={changeTweet} onChange={onChange}/>:
            <Payload>{tweet}</Payload>}
            {user?.uid === userId ? <DeleteButton onClick={onDelete}>Delete</DeleteButton> : null}
            {user?.uid === userId ? isEdit ? <DeleteButton className="cancelBtn" onClick={onEdit}>cancel</DeleteButton> :<DeleteButton onClick={onEdit}>Eidt</DeleteButton> : null}
            {user?.uid === userId ? isEdit ? <DeleteButton className="editSubmitBtn" onClick={onEditSubmit}>Edit Tweet</DeleteButton> : null : null}
        </Column>
        <Column className="photoBox">
            {viewPhoto === "" ? null : <Photo src={viewPhoto} /> }
            {isEdit ? <FileChangeButton htmlFor={id}> edit </ FileChangeButton>: null}
            <FileChangeInput onChange={onFileChange} type="file" id={id} accept="image/*" />
        </Column>
    </Wrapper>
    )
}
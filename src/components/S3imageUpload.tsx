import AWS from "aws-sdk";

export default function S3ImageUpload(file: File, name: string|null) {
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
    const uploadToS3 = async(file: File, name: string|null) => {
        let image = file.name;
        let imageKey = name; 
        try {
            const params = {
                ACL : "public-read",
                Body : file,
                Bucket : S3_BUKKET,
                ContentType: file.type,
                Key : "upload/" + file.name + name,
            };
            const url = await myBuket.upload(params, (error:any)=>{
                console.log(error);
            }).promise()
            image = url.Location;
            imageKey = url.Key;
            console.log(url.Location);
        } catch (error) {
            console.log(error);
        }
        return {image, imageKey};
    }

    return uploadToS3(file, name);
}
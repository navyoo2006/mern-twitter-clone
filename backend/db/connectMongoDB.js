import mongoose from 'mongoose'; //load the value of mongoose module into the variable mongoose

const connectMongoDB = async () => {
    try
    {
        const conn = await mongoose.connect(process.env.MONGO_URI) //this connection stream allows for you to connect the mongodb database
        console.log(`MongoDB connected: ${conn.connection.host}`);

    } catch (error)
    {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
}

export default connectMongoDB;
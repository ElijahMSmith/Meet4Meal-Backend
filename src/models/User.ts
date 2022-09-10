import { Model, Schema, model, Types } from 'mongoose';
import validator from 'validator';
import bcrypt = require('bcryptjs');

interface IUser {
    email: string;
    password: string;
}

interface UserModel extends Model<IUser> {
    findByCredentials(email: string, password: string): Promise<IUser>;
}

const userSchema = new Schema<IUser, UserModel>({
    email: {
        type: String,
        required: true,
        maxLength: 40,
        trim: true,
        unique: true,
        lowercase: true,
        validate: (value: string) => {
            if (!validator.isEmail(value))
                throw new Error('Invalid Email address');
        },
    },
    password: {
        type: String,
        required: true,
        minLength: 7,
    },
});

// Hash the password before saving the user model
userSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('password'))
        user.password = await bcrypt.hash(user.password, 8);
    next();
});

// Search for a user by email and password
userSchema.statics.findByCredentials = async function (
    email: string,
    password: string
): Promise<IUser> {
    const user = await User.findOne({ email });
    if (!user) throw new Error('Could not find the given email');

    const passwordCorrect = await bcrypt.compare(password, user.password);
    if (!passwordCorrect) throw new Error('Incorrect password for given email');

    return user;
};

const User = model<IUser, UserModel>('User', userSchema);
export default User;

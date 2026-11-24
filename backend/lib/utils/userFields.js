// Fields that can be shared with other accounts. Email and password stay private.
export const PUBLIC_USER_FIELDS = "_id fullName username profileImg coverImg bio link followers following createdAt updatedAt";

export const ownUserResponse = (user) => {
    const data = user.toObject();
    delete data.password;
    return data;
};

import typeorm from "typeorm"
var EntitySchema = typeorm.EntitySchema;

export const FriendsDate = new EntitySchema({
    name: "friendsDate", // Will use table name `post` as default behaviour.
    tableName: "friendsdate", // Optional: Provide `tableName` property to override the default behaviour for table name.
    columns: {
        usersId_1: {
            primary: true,
            type: "int",
        },
        usersId_2: {
            primary: true,
            type: "int",
        },
        time: {
            type: "timestamp",
            nullable: false,
            default: () => "CURRENT_TIMESTAMP",
        },
    },
});